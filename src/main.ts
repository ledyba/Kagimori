import { browser } from 'webextension-polyfill-ts'
import Key from './Key'
import {loadKeys, saveKeys} from './Repo'

function reload(keys: Array<Key>) {
  const dom = document.getElementById('keys')! as HTMLDivElement;
  dom.innerHTML = '';
  for(const key of keys) {
  }
}

async function setup() {
  reload(await loadKeys());
}

function openConfig() {
  const url = browser.extension.getURL('static/config.html');
  async function handler() {
    const tabs = await browser.tabs.query({currentWindow:true});
    for (let i=0; i < tabs.length; i++) {
      if (tabs[i].url === url) {
        browser.tabs.update(tabs[i].id, {active:true});
       return;
      }
    }
    await browser.tabs.create({url:url, active:true});
  }
  handler().catch(reportExecuteScriptError);
}

function doInspect() {

}

function main() {
  Promise.all([
    browser.tabs.executeScript({file: "/dist/remote.js"}),
    setup()
  ]).catch(reportExecuteScriptError);

  const addButton: HTMLImageElement = document.getElementById('add-button')! as HTMLImageElement;
  addButton.setAttribute('draggable', 'false');
  addButton.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    doInspect();
    return false;
  });

  const configButton: HTMLImageElement = document.getElementById('config-button')! as HTMLImageElement;
  configButton.setAttribute('draggable', 'false');
  configButton.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    openConfig();
    return false;
  });

}

function reportExecuteScriptError(error: Error) {
  document.getElementById("popup-content")!.classList.add("hidden");
  document.getElementById("error-content")!.classList.remove("hidden");
  document.getElementById("error-string")!.innerText = error.message;
}

document.addEventListener('DOMContentLoaded', main);
