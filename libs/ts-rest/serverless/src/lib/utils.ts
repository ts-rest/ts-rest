function isArrayBuffer(maybeBuffer: unknown): maybeBuffer is ArrayBuffer {
  return (
    maybeBuffer instanceof ArrayBuffer ||
    (typeof maybeBuffer === 'object' &&
      Object.prototype.toString.call(maybeBuffer) === '[object ArrayBuffer]')
  );
}

export async function arrayBufferToBase64(bufferOrBlob: ArrayBuffer | Blob) {
  if (isArrayBuffer(bufferOrBlob)) {
    if (globalThis.Buffer) {
      return Buffer.from(bufferOrBlob).toString('base64');
    }

    return btoa(String.fromCharCode(...new Uint8Array(bufferOrBlob)));
  }

  return arrayBufferToBase64(await blobToArrayBuffer(bufferOrBlob));
}

export async function arrayBufferToString(bufferOrBlob: ArrayBuffer | Blob) {
  if (isArrayBuffer(bufferOrBlob)) {
    if (globalThis.TextDecoder) {
      return new TextDecoder().decode(bufferOrBlob);
    }

    if (globalThis.Buffer) {
      return Buffer.from(bufferOrBlob).toString();
    }

    return String.fromCharCode(...new Uint8Array(bufferOrBlob));
  }

  if (bufferOrBlob instanceof Blob) {
    if (typeof bufferOrBlob.text === 'function') {
      return bufferOrBlob.text();
    }

    if (globalThis.FileReader) {
      return await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsText(bufferOrBlob);
      });
    }
  }

  return arrayBufferToString(await blobToArrayBuffer(bufferOrBlob));
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }

  for (const symbolKey of Object.getOwnPropertySymbols(blob)) {
    // detecting if blob is a jsdom polyfill
    if (symbolKey.description === 'impl') {
      const blobImpl = (blob as any)[symbolKey];
      const buffer = blobImpl._buffer as Buffer;
      return buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      );
    }
  }

  if (globalThis.FileReader) {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        resolve(fileReader.result as ArrayBuffer);
      };
      fileReader.readAsArrayBuffer(blob);
    });
  }

  throw new Error('Unable to convert blob to array buffer');
}

// Credits: https://github.com/nfriedly/set-cookie-parser/blob/master/lib/set-cookie.js
export const splitCookiesString = (cookiesString: string) => {
  const cookiesStrings: string[] = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;

  function skipWhitespace() {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  }

  function notSpecialChar() {
    ch = cookiesString.charAt(pos);

    return ch !== '=' && ch !== ';' && ch !== ',';
  }

  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;

    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ',') {
        // ',' is a cookie separator if we have later first '=', not ';' or ','
        lastComma = pos;
        pos += 1;

        skipWhitespace();
        nextStart = pos;

        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }

        // currently special character
        if (pos < cookiesString.length && cookiesString.charAt(pos) === '=') {
          // we found cookies separator
          cookiesSeparatorFound = true;
          // pos is inside the next cookie, so back up and return it.
          pos = nextStart;
          cookiesStrings.push(cookiesString.substring(start, lastComma));
          start = pos;
        } else {
          // in param ',' or param separator ';',
          // we continue from that comma
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }

    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
    }
  }

  return cookiesStrings;
};
