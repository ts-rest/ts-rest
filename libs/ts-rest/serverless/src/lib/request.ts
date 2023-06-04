import { IRequest } from 'itty-router';

type TsRestRequestInit = {
  method: string;
  url: string;
  headers: Headers;
  body: ArrayBuffer;
};

export class TsRestRequest implements Omit<IRequest, 'body'> {
  public method: string;
  public url: string;
  public headers: Headers;
  public body: ArrayBuffer;
  public route: string;
  public params: {
    [key: string]: string;
  };
  public query: {
    [key: string]: string | string[] | undefined;
  };

  constructor(init: TsRestRequestInit) {
    this.method = init.method;
    this.url = init.url;
    this.headers = init.headers;
    this.body = init.body;
    this.route = '';
    this.params = {};
    this.query = {};
  }
}
