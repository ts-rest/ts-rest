import { TsRestResponseError } from '@ts-rest/core';

export class TsRestHttpError extends Error {
  constructor(
    public statusCode: number,
    public body: any,
    public contentType = 'application/json',
  ) {
    super();

    this.name = this.constructor.name;

    if (typeof body === 'string') {
      this.message = body;
    } else if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string'
    ) {
      this.message = body['message'];
    } else {
      this.message = 'Error';
    }
  }
}

export { TsRestResponseError };
