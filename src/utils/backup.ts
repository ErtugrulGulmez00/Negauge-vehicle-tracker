const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encodes a string into UTF-8 safe Base64.
 */
export const encodeBase64 = (str: string): string => {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      // surrogate pair
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }

  let result = '';
  let i = 0;
  const len = bytes.length;
  for (; i < len - 2; i += 3) {
    result += chars[bytes[i] >> 2];
    result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += chars[bytes[i + 2] & 63];
  }

  if (i < len) {
    result += chars[bytes[i] >> 2];
    if (i === len - 1) {
      result += chars[(bytes[i] & 3) << 4];
      result += '==';
    } else {
      result += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      result += chars[(bytes[i + 1] & 15) << 2];
      result += '=';
    }
  }

  return result;
};

/**
 * Decodes a UTF-8 safe Base64 string back to original string.
 */
export const decodeBase64 = (str: string): string => {
  const buffer = str.replace(/=+$/, '');
  const len = buffer.length;
  const bytes = [];
  let i = 0;

  const lookup: { [key: string]: number } = {};
  for (let idx = 0; idx < chars.length; idx++) {
    lookup[chars[idx]] = idx;
  }

  for (; i < len; i += 4) {
    const b1 = lookup[buffer[i]];
    const b2 = lookup[buffer[i + 1]];
    const b3 = i + 2 < len ? lookup[buffer[i + 2]] : 0;
    const b4 = i + 3 < len ? lookup[buffer[i + 3]] : 0;

    bytes.push((b1 << 2) | (b2 >> 4));
    if (i + 2 < len) {
      bytes.push(((b2 & 15) << 4) | (b3 >> 2));
    }
    if (i + 3 < len) {
      bytes.push(((b3 & 3) << 6) | b4);
    }
  }

  let result = '';
  let idx = 0;
  while (idx < bytes.length) {
    const c = bytes[idx++];
    if (c < 0x80) {
      result += String.fromCharCode(c);
    } else if (c < 0xe0) {
      const c2 = bytes[idx++];
      result += String.fromCharCode(((c & 0x1f) << 6) | (c2 & 0x3f));
    } else if (c < 0xf0) {
      const c2 = bytes[idx++];
      const c3 = bytes[idx++];
      result += String.fromCharCode(((c & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f));
    } else {
      const c2 = bytes[idx++];
      const c3 = bytes[idx++];
      const c4 = bytes[idx++];
      let code = ((c & 0x07) << 18) | ((c2 & 0x3f) << 12) | ((c3 & 0x3f) << 6) | (c4 & 0x3f);
      code -= 0x10000;
      result += String.fromCharCode(0xd800 | (code >> 10), 0xdc00 | (code & 0x3ff));
    }
  }

  return result;
};
