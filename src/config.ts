import { browser } from 'webextension-polyfill-ts'
import {Key} from './Key'
import { loadKeys, clearKeys, saveKeys } from './Repo';
import jsQR from "jsqr";

let messgeTimeout: number | null = null;
function showMessage(message: string, success: boolean) {
  let messageBox = document.getElementById('message-box')!;
	if (success) {
		messageBox.className = 'visible success';
	} else {
		messageBox.className = 'visible error';
	}
  messageBox.innerText = message;

  if(messgeTimeout) {
    clearTimeout(messgeTimeout);
  }

	messgeTimeout = window.setTimeout(function() {
    messageBox.className = '';
    messgeTimeout = null;
	}, 3 * 1000);
}

let keys: Key[];
function showKeyList(newKeys: Key[]) {
  const keyList = document.getElementById('key-list')! as HTMLDivElement;
  keyList.innerHTML = '';
  keys = newKeys;
  for(let key of keys) {
    const el = document.createElement('div');
    el.classList.add('key-item');
    {
      const container = document.createElement('div');
      container.classList.add('key-info');
      {
        const child = document.createElement('div');
        child.classList.add('issuer');
        child.innerText = key.issuer;
        container.appendChild(child);
      }
      {
        const child = document.createElement('div');
        child.classList.add('issuer');
        child.innerText = key.label;
        container.appendChild(child);
      }
      el.appendChild(container);
    }
    {
      const removeButton = document.createElement('img');
      removeButton.classList.add('key-remove');
      removeButton.src = './remove_circle-black-48dp.svg';
      removeButton.setAttribute('draggable', 'false');
      el.appendChild(removeButton);
      removeButton.addEventListener('click', () => {
        async function handler() {
          const idx = keys.indexOf(key);
          if(idx >= 0 && confirm(`Really would like to remove key: "${key.issuer}/${key.label}"?`)) {
            keys.splice(keys.indexOf(key), 1);
            await saveKeys(keys);
            showKeyList(keys);
          }
        }
        handler().catch((err: any) => {
          showMessage(''+err, false);
        })
      });
    }
    keyList.appendChild(el);
  }
}

function doImport(event: Event) {
  const file = (event.target as HTMLInputElement)?.files;
  if (!file) {
    return;
  }
  let reader = new FileReader();
  
  reader.onload = function(e) {
    let data: [Key];
    let result = reader.result;
    try {
      data = JSON.parse(result as string);
    } catch(e) {
      const err = e as Error;
      showMessage('Failed to parse JSON data, invalid JSON:<br>' + (err.message||'???'), false);
      return;
    }
    async function handler() {
      await saveKeys(data);
      return data;
    }
    function onLoaded() {
      showMessage('Imported!', true);
      showKeyList(data);
    }
    handler().then(onLoaded).catch((err: any) => {
      showMessage('Failed to import file:<br>' + (''+err), false);
    });
  };
  reader.onerror = (ev: ProgressEvent<FileReader>) => {
    showMessage('Failed to import file:<br>' + (reader.error?.message || '???'), false);
  };
  try {
    reader.readAsText(file[0], 'utf-8');
  } catch(e) {
    const err = e as Error;
    showMessage('Failed to import file:<br>' + (err.message||'???'), false);
  }
}

function doExport() {
  async function handler() {
    const keys = await loadKeys();
    const json = JSON.stringify(keys, null, 2);
    const url = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    const link = document.createElement("a");
    link.download = 'kagimori.json';
    link.href = url;
    link.click();
  }
  handler().then(() => {
    showMessage('Exported!', true);
  }).catch((err: any) => {
    showMessage('Failed to export:<br>' + err, false);
  });
}

function doClear() {
  async function handler() {
    await clearKeys();
  }
  handler().then(() => {
    showMessage('Cleard!', true);
    showKeyList([]);
  }).catch((err: any) => {
    showMessage('Failed to clear:<br>' + err, false);
  });
}

function doAnalyze(event: Event) {
  const kPattern = /otpauth:\/\/([A-Za-z]+)\/([^?]+)\??(.*)?/i
  const file = (event.target as HTMLInputElement)?.files;
  if (!file) {
    return;
  }
  let reader = new FileReader();
  
  reader.onload = function(ev: Event) {
    const dataURL = reader.result as string;
    const image = new Image();
    image.onload = (ev: Event) => { 
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);
      const code = jsQR(ctx.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
      if(code === null) {
        showMessage('Failed to decode as QR code', false);
        return;
      }
      console.log(code.data);
      const key: Key = {
        issuer: '',
        label: '',
        type: 'totp',
        period: 30,
        digits: 6,
        algorithm: 'SHA1',
        secret: '',
      };
      // https://gitlab.com/dominicp/otpauth-uri-parser/-/blob/master/index.js
      const parsed = kPattern.exec(code.data);
      if(parsed === null || parsed.length < 3) {
        showMessage('Failed to parse OTPauth URI', false);
        return;
      }
      const [_, type, encodedLabel] = parsed;
      key.type = type;
      const decodedLabel = decodeURIComponent(encodedLabel);
      const labelParts = decodedLabel.split(/: ?/);
      if(labelParts.length === 2) {
        key.issuer = labelParts[0];
        key.label = labelParts[1];
      } else {
        key.label = decodedLabel;
      }
      if(parsed.length >= 4) {
        const params = new URLSearchParams(parsed[3]);
        const secret = params.get('secret');
        if(secret === null) {
          showMessage('Failed to parse OTP Auth URI: No secrets.', false);
          return;
        }
        key.secret = secret;
        const issuer = params.get('issuer');
        if(issuer !== null && issuer.length > 0) {
          key.issuer = issuer;
        }
        const algorithm = params.get('algorithm');
        if(algorithm !== null && algorithm.length > 0) {
          key.algorithm = algorithm;
        }
        const digits = params.get('digits');
        if(digits !== null && digits.length > 0) {
          key.digits = parseInt(digits, 10);
        }
        const period = params.get('period');
        if(period !== null && period.length > 0) {
          key.period = parseInt(period, 10);
        }
      }
      async function handler() {
        const keys = await loadKeys();
        keys.push(key);
        await saveKeys(keys);
        return keys;
      }
      function onAdded(keys: Key[]) {
        showMessage('Added!', true);
        showKeyList(keys);
      }
      handler().then(onAdded).catch((err: any) => {
        showMessage('Failed to add key:<br>' + err, false);
      });
    };
    image.onerror = (event: Event | string, source?: string, lineno?: number, colno?: number, error?: Error) => {
      showMessage('Failed to decode image:' + (error?.message||'???'), false);
    };
    image.src = dataURL;
  };
  reader.onerror = (ev: ProgressEvent<FileReader>) => {
    showMessage('Failed to import file:<br>' + (reader.error?.message || '???'), false);
  };

  try {
    reader.readAsDataURL(file[0]);
  } catch(e) {
    const err = e as Error;
    showMessage('Failed to read import file:<br>' + (err.message||'???'), false);
  }
}

function main() {
  {
    const addButton: HTMLDivElement = document.getElementById('add-button')! as HTMLDivElement;
    addButton.addEventListener('dragstart', (ev: MouseEvent) => {
      ev.preventDefault();
      return false;
    });
    addButton.setAttribute('draggable', 'false');
    const addInput: HTMLInputElement = document.getElementById('add-input')! as HTMLInputElement;
    addInput.addEventListener('change', (ev: Event) => {
      ev.preventDefault();
      doAnalyze(ev);
      return false;
    });
  }

  {
    const exportButton: HTMLDivElement = document.getElementById('export-button')! as HTMLDivElement;
    exportButton.addEventListener('dragstart', (ev: MouseEvent) => {
      ev.preventDefault();
      return false;
    });
    exportButton.addEventListener('click', (ev: MouseEvent) => {
      ev.preventDefault();
      doExport();
      return false;
    });
  }

  {
    const importButton: HTMLDivElement = document.getElementById('import-button')! as HTMLDivElement;
    importButton.addEventListener('dragstart', (ev: MouseEvent) => {
      ev.preventDefault();
      return false;
    });
    importButton.setAttribute('draggable', 'false');
  
    const importInput: HTMLInputElement = document.getElementById('import-input')! as HTMLInputElement;
    importInput.addEventListener('change', (ev: Event) => {
      ev.preventDefault();
      doImport(ev);
      return false;
    });
  }

  {
    const clearKeys: HTMLDivElement = document.getElementById('clear-button')! as HTMLDivElement;
    clearKeys.setAttribute('draggable', 'false');
    clearKeys.addEventListener('click', (ev: MouseEvent) => {
      ev.preventDefault();
      doClear();
      return false;
    });
  }

  (async () => {
    const keys = await loadKeys();
    showKeyList(keys);
  })().catch((err: any) => showMessage(''+err, false));
}

document.addEventListener('DOMContentLoaded', main);
