import { IRequest } from 'itty-router';

export class TsRestRequest extends Request implements IRequest {
  public route: string;
  public params: {
    [key: string]: string;
  };
  public query: {
    [key: string]: string | string[] | undefined;
  };
  public content?: any;

  constructor(urlOrRequest: string | Request, init?: RequestInit) {
    super(urlOrRequest, init);

    this.route = '';
    this.params = {};
    this.query = {};
  }
}
