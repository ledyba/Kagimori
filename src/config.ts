import { browser } from 'webextension-polyfill-ts'
import Key from './Key'
import { loadKeys, clearKeys, saveKeys } from './Repo';

let messgeTimeout: NodeJS.Timeout | null = null;
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

	messgeTimeout = setTimeout(function() {
    messageBox.className = '';
	}, 3 * 1000);
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

  const importInput: HTMLInputElement = document.getElementById('import-input')! as HTMLInputElement;
  importInput.addEventListener('change', (ev: Event) => {
    ev.preventDefault();
    doImport(ev);
    return false;
  });

  const clearKeys: HTMLDivElement = document.getElementById('clear-button')! as HTMLDivElement;
  clearKeys.addEventListener('dragstart', (ev: MouseEvent) => {
    ev.preventDefault();
    return false;
  });
  clearKeys.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    doClear();
    return false;
  });
}

document.addEventListener('DOMContentLoaded', main);
