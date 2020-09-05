import CryptoJS from 'crypto-js';

export interface Key {
  issuer: string;
  label: string;
  type: string;
  period: number;
  digits: number;
  algorithm: string;
  secret: string;
}

function sha1(buff: ArrayBuffer): Uint8Array {
  return Uint8Array.from(atob(CryptoJS.SHA1(CryptoJS.lib.WordArray.create(buff)).toString(CryptoJS.enc.Base64)), c => c.charCodeAt(0));
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

    const buff1 = new Uint8Array(new ArrayBuffer(blockSize)); // K XOR opad
    {
      const secret = (new TextEncoder()).encode(key.secret);
      buff1.set(secret, 0);
      for(let i = 0; i < buff1.length; ++i) {
        buff1[i] = buff1[i] ^ 0x5C;
      }
    }
    const buff2 = new Uint8Array(new ArrayBuffer(blockSize + 8)); // K XOR ipad, text
    {
      const secret = (new TextEncoder()).encode(key.secret);
      buff2.set(secret, 0);
      for(let i = 0; i < blockSize; ++i) {
        buff2[i] = buff2[i] ^ 0x36;
      }
      new DataView(buff2.buffer).setBigUint64(blockSize, BigInt(counter), false);
    }
    const buff3 = sha1(buff2)
    const buff = new Uint8Array(new ArrayBuffer(buff1.byteLength + buff3.byteLength));
    buff.set(buff1, 0);
    buff.set(buff3, buff1.byteLength);
    const mac = sha1(buff);

    // Truncate
    // https://tools.ietf.org/html/rfc4226#section-5.3
    const sBits = (() => {
      const offsetBits = mac[19] & 0xf;
      const offset = offsetBits;
      const p = (mac[offset] << 24) | (mac[offset+1] << 16) | (mac[offset+2] << 8) | (mac[offset+3] << 0);
      return p & 0x7fffffff;
    })();
    const sNum = sBits;
    const code = ((sNum % (Math.pow(10, key.digits))) | 0).toString();
    return (Array(key.digits).join('0') + code).slice(-key.digits);
  }
  default:
    return `Unsupported algorithm: ${key.algorithm}`;
  }
}

function totp(key: Key): string {
  return hotp(key, (new Date().getTime() / 1000) | 0);
}

export function generateKey(key: Key): string {
  switch(key.type.toLowerCase()) {
  case 'totp':
    return totp(key);
  default:
    return `Unsupported algorithm: ${key.algorithm}`;
  }
}
