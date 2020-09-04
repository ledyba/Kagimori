import { browser, Runtime } from 'webextension-polyfill-ts'
import Key from './Key'

function connectionHandler(port: Runtime.Port) {
};

browser.runtime.onConnect.addListener(connectionHandler);
