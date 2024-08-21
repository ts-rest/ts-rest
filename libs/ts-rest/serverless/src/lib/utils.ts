export async function arrayBufferToBase64(bufferOrBlob: ArrayBuffer | Blob) {
  const str = await arrayBufferToString(bufferOrBlob);
  return btoa(str);
}

export async function arrayBufferToString(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return blob.text();
}

export function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}
