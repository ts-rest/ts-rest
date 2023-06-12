export type TsRestResponseInit = {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string | ArrayBuffer | Blob | null;
};

export class TsRestResponse {
  public statusCode: number;
  public headers: Record<string, string | string[]>;
  public body: string | ArrayBuffer | Blob | null;

  constructor(init: TsRestResponseInit) {
    this.statusCode = init.statusCode;
    this.headers = init.headers;
    this.body = init.body;
  }
}
