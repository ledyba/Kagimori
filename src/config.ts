import { browser } from 'webextension-polyfill-ts'
import Key from './Key'
import { loadKeys, clearKeys, saveKeys } from './Repo';

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
    console.log(key);
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
      showMessage('Failed to parse JSON data, invalid JSON:\n' + (e.message||'???'), false);
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
    handler().then(onLoaded).catch();
  };

  try {
    reader.readAsText(file[0], 'utf-8');
  } catch(e) {
    showMessage('Failed to read import file:\n' + (e.message||'???'), false);
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
    showMessage('Failed to export:\n' + err, false);
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
    showMessage('Failed to clear:\n' + err, false);
  });
}

function main() {

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

  const clearKeys: HTMLDivElement = document.getElementById('clear-button')! as HTMLDivElement;
  clearKeys.setAttribute('draggable', 'false');
  clearKeys.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    doClear();
    return false;
  });

  (async () => {
    const keys = await loadKeys();
    showKeyList(keys);
  })().catch((err: any) => showMessage(''+err, false));
}

document.addEventListener('DOMContentLoaded', main);
