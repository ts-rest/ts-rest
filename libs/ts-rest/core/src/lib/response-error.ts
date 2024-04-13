import { AppRoute } from './dsl';
import { ServerInferResponses } from './infer-types';
import { HTTPStatusCode } from './status-codes';

export class TsRestResponseError<T extends AppRoute> extends Error {
  public statusCode: HTTPStatusCode;
  public body: any;

  constructor(route: T, response: ServerInferResponses<T>) {
    super();

    this.statusCode = response.status;
    this.body = response.body;
    this.name = this.constructor.name;

    if (typeof response.body === 'string') {
      this.message = response.body;
    } else if (
      typeof response.body === 'object' &&
      response.body !== null &&
      'message' in response.body &&
      typeof response.body.message === 'string'
    ) {
      this.message = response.body['message'];
    } else {
      this.message = 'Error';
    }
  }
}
