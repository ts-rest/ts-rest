import {
  AppRoute,
  isAppRouteOtherResponse,
  ServerInferResponses,
} from '@ts-rest/core';

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

export class TsRestRouteError<T extends AppRoute> extends TsRestHttpError {
  constructor(route: T, response: ServerInferResponses<T>) {
    const responseType = route.responses[response.status];
    const contentType = isAppRouteOtherResponse(responseType)
      ? responseType.contentType
      : 'application/json';

    super(response.status, response.body, contentType);
  }
}
