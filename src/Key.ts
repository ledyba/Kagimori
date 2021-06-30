import CryptoJS from 'crypto-js'
import WordArray from 'crypto-js/lib-typedarrays'
import { base32Decode } from '@ctrl/ts-base32';

export interface Key {
  issuer: string;
  label: string;
  type: string;
  period: number;
  digits: number;
  algorithm: string;
  secret: string;
}

function createArrayBuffer(buff: ArrayBuffer): WordArray {
  // FIXME: safe: It's okay to pass ArrayBuffer
  return CryptoJS.lib.WordArray.create(buff as any as number[]);
}

function createUint8Array(base64str: string): Uint8Array {
  const buffStr = window.atob(base64str);
  const bytes = new Uint8Array(buffStr.length);
  for (let i = 0; i < buffStr.length; i++) {
    bytes[i] = buffStr.charCodeAt(i);
  }
  return bytes;
}

function sha1(buff: ArrayBuffer): Uint8Array {
  const input = createArrayBuffer(buff);
  const digest = CryptoJS.SHA1(input);
  return createUint8Array(digest.toString(CryptoJS.enc.Base64));
}

function hmac(key: ArrayBuffer, text: ArrayBuffer): Uint8Array {
  const digest = CryptoJS.HmacSHA1(createArrayBuffer(key), createArrayBuffer(text));
  return createUint8Array(digest.toString(CryptoJS.enc.Base64));
}

function hotp(key: Key, counter: number): string {
  switch(key.algorithm.toLowerCase()) {
  case 'sha1': {
    const blockSize = 64;
    // https://tools.ietf.org/html/rfc4226#section-5.2
    // HOTP(K,C) = Truncate(HMAC-SHA-1(K,C))

    // HMAC
    // https://tools.ietf.org/html/rfc2104
    // H(K XOR opad, H(K XOR ipad, text))

    const secret = new Uint8Array(base32Decode(key.secret));
    const buff1 = new Uint8Array(blockSize); // K XOR opad
    {
      buff1.fill(0);
      buff1.set(secret, 0);
      for(let i = 0; i < buff1.length; ++i) {
        buff1[i] = buff1[i] ^ 0x5C;
      }
    }
    let buff2 = new Uint8Array(blockSize + 8); // K XOR ipad, text
    {
      buff2.fill(0);
      buff2.set(secret, 0);
      for(let i = 0; i < blockSize; ++i) {
        buff2[i] = buff2[i] ^ 0x36;
      }
      new DataView(buff2.buffer).setBigUint64(blockSize, BigInt(counter), false);
    }
    buff2 = sha1(buff2);
    const buff = new Uint8Array(buff1.byteLength + buff2.byteLength);
    buff.set(buff1, 0);
    buff.set(buff2, buff1.byteLength);
    let digest = sha1(buff);

    // Truncate
    // https://tools.ietf.org/html/rfc4226#section-5.3
    const offset =  digest[digest.byteLength - 1] & 15;
    const otp = (((digest[offset + 0] & 127) << 24)
               | ((digest[offset + 1] & 255) << 16)
               | ((digest[offset + 2] & 255) << 8)
               | ((digest[offset + 3] & 255) << 0))
               % (10 ** key.digits);
    const token = (new Array(key.digits).fill('0').join('') + otp).slice(-key.digits);
    return token;
  }

  default:
    return `Unsupported algorithm: ${key.algorithm}`;
  }
}

function totp(key: Key): string {
  return hotp(key, Math.floor(Date.now() / 1000 / key.period));
}

export function generateKey(key: Key): string {
  switch(key.type.toLowerCase()) {
  case 'totp':
    return totp(key);
  default:
    return `Unsupported algorithm: ${key.algorithm}`;
  }
}
