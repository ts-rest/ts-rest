export type TsRestResponseInit = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string | ArrayBuffer | Blob;
};

export class TsRestResponse {
  public statusCode: number;
  public headers: Record<string, string | string[]>;
  public body: string | ArrayBuffer | Blob;

  constructor(init: TsRestResponseInit) {
    this.statusCode = init.statusCode;
    this.headers = init.headers;
    this.body = init.body;
  }
}
