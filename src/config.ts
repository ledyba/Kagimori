import { browser } from 'webextension-polyfill-ts'
import Key from './Key'
import { loadKeys, clearKeys } from './Repo';

function doImport() {

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
  handler().catch(alert);
}

function doClear() {
  async function handler() {
    const keys = await clearKeys();
  }
  handler().catch(alert);
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
  importButton.addEventListener('click', (ev: MouseEvent) => {
    ev.preventDefault();
    doImport();
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
