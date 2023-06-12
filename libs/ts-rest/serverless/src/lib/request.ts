import { IRequest } from 'itty-router';

export type TsRestRequestInit = {
  method: string;
  url: string;
  headers: Headers;
  body?: ArrayBuffer | string;
};

export class TsRestRequest extends Request implements IRequest {
  public route: string;
  public params: {
    [key: string]: string;
  };
  public query: {
    [key: string]: string | string[] | undefined;
  };
  public content?: any;

  constructor(url: string, init: TsRestRequestInit) {
    super(url, init);

    this.route = '';
    this.params = {};
    this.query = {};
  }
}
