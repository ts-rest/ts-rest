interface FileReader extends EventTarget {
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null;
  readonly result: string | ArrayBuffer | null;
  readAsArrayBuffer(blob: Blob): void;
  readAsDataURL(blob: Blob): void;
  readAsText(blob: Blob, encoding?: string): void;
}

// eslint-disable-next-line no-var
declare var FileReader: {
  prototype: FileReader;
  new (): FileReader;
  readonly EMPTY: 0;
  readonly LOADING: 1;
  readonly DONE: 2;
};
