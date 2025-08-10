import * as Browser from 'webextension-polyfill'
import {Key} from './Key'

const storage =  Browser.storage.sync;
//const storage =  Browser.storage.local;

export async function loadKeys(): Promise<Array<Key>> {
  const v = await storage.get('keys');
  let keys = v['keys'] as Array<Key>;
  if(keys === undefined) {
    keys = new Array<Key>();
  }
  return keys;
}

export async function saveKeys(keys: Array<Key>) {
  await storage.set({'keys': keys});
}

export async function clearKeys() {
  await storage.set({'keys': []});
}
