import {browser} from 'webextension-polyfill-ts'
import Key from './Key'
import {loadKeys} from './Repo'

function reload(keys: Array<Key>) {
  const keyList = document.getElementById('keys')! as HTMLDivElement;
  keyList.innerHTML = '';
  for(const key of keys) {
    const el = document.createElement('div');
    el.classList.add('key-item');
    {
      const icon = document.createElement('img');
      icon.classList.add('key-icon');
      icon.src = './vpn_key-black-48dp.svg';
      icon.setAttribute('draggable', 'false');
      el.appendChild(icon);
    }
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
    keyList.appendChild(el);
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

async function doInspect() {
  await browser.tabs.executeScript({file: "/dist/remote.js"});
}

function main() {
  Promise.all([
    setup()
  ]).catch(reportExecuteScriptError);

  const addButton: HTMLImageElement = document.getElementById('add-button')! as HTMLImageElement;
  addButton.setAttribute('draggable', 'false');
  addButton.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    doInspect().catch(reportExecuteScriptError);
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
