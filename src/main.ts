import { browser } from 'webextension-polyfill-ts'

interface Key {
  issuer: string;
  label: string;
  type: string;
  digits: number;
  algorithm: string;
  secret: string;
}

function reload(keys: Map<string, Key>) {
  const dom = document.getElementById('keys')! as HTMLDivElement;
  dom.innerHTML = '';
  for(const key of keys) {
  }
}

function inspect() {

}

async function setup() {
  const sync = browser.storage.local;
  const v = await sync.get('keys');
  let keys: Map<string, Key> = v.keys;
  if(keys === undefined) {
    keys = new Map<string, Key>();
  }
  reload(keys);
}

function main() {
  const addButton: HTMLImageElement = document.getElementById('add-button')! as HTMLImageElement;
  addButton.addEventListener('dragstart', (ev: MouseEvent) => {
    ev.preventDefault();
    return false;
  });
  addButton.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    inspect();
    return false;
  });
  setup().catch(reportExecuteScriptError);
}

function reportExecuteScriptError(error: Error) {
  document.getElementById("popup-content")!.classList.add("hidden");
  document.getElementById("error-content")!.classList.remove("hidden");
  console.error(`Failed to execute content script: ${error.message}`);
}

document.addEventListener('DOMContentLoaded', main);
