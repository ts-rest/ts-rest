import { ParsedQuery } from './query';

type TsRestRequestInit = {
  remoteAddress?: string;
  method: string;
  path: string;
  query: ParsedQuery;
  headers: Headers;
  body: ArrayBuffer;
};

export class TsRestRequest {
  protected _remoteAddress?: string;
  protected _method: string;
  protected _path: string;
  protected _query: ParsedQuery;
  protected _headers: Headers;
  protected _body: ArrayBuffer;

  constructor(init: TsRestRequestInit) {
    this._remoteAddress = init.remoteAddress;
    this._method = init.method;
    this._path = init.path;
    this._query = init.query;
    this._headers = init.headers;
    this._body = init.body;
  }

  public get remoteAddress() {
    return this._remoteAddress;
  }

  public get method() {
    return this._method;
  }

  public get path() {
    return this._path;
  }

  public get query() {
    return this._query;
  }

  public get headers() {
    return this._headers;
  }

  public get body() {
    return this._body;
  }
}
