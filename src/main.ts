import {browser} from 'webextension-polyfill-ts'
import {Key, generateKey} from './Key'
import {loadKeys} from './Repo'

function reload(keys: Array<Key>) {
  const keyList = document.getElementById('keys')! as HTMLDivElement;
  keyList.innerHTML = '';
  for(const key of keys) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('keys-wrapper');
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
      el.addEventListener('click', () => {
        (async () => {
          const p = generateKey(key);
          const cover = document.createElement('div');
          cover.classList.add('key-cover');
          const iconElem = document.createElement('img');
          iconElem.src = './done-black-48dp.svg';
          iconElem.style.width = '2em';
          iconElem.style.height = '2em';
          cover.appendChild(iconElem);
          const keyElem = document.createElement('span');
          keyElem.innerText = p;
          cover.appendChild(keyElem);
          cover.style.transition = 'opacity 3000ms ease-in';
          window.setTimeout(() => {
            wrapper.removeChild(cover);
          }, 3000);
          window.requestAnimationFrame(() => {
            cover.style.opacity = '0';
          });
          navigator.clipboard.writeText(p).catch(reportExecuteScriptError);
          wrapper.appendChild(cover);
        })().catch(reportExecuteScriptError);
      });
    }
    wrapper.appendChild(el);
    keyList.appendChild(wrapper);
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

function main() {
  Promise.all([
    setup()
  ]).catch(reportExecuteScriptError);

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
