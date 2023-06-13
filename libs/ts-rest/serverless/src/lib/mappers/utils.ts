export async function arrayBufferToBase64(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
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
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsText(blob);
  });
}
