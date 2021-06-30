import { browser } from 'webextension-polyfill-ts'
import {Key} from './Key'

//const storage =  browser.storage.sync;
const storage =  browser.storage.local;

export async function loadKeys(): Promise<Array<Key>> {
  const v = await storage.get('keys');
  let keys: Array<Key> = v.keys;
  if(keys === undefined) {
    keys = new Array<Key>();
  }
  return keys;
}

export async function saveKeys(keys: Array<Key>) {
  await storage.set({keys: keys});
}

export async function clearKeys() {
  await storage.set({keys: []});
}
