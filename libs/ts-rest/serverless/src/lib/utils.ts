export async function arrayBufferToBase64(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

export async function arrayBufferToString(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsText(blob);
  });
}

export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve) => {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      resolve(fileReader.result as ArrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
  });
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
