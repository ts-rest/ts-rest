import type { ALBEvent, ALBResult } from 'aws-lambda';
import { TsRestRequest } from '../../request';
import type { TsRestResponse } from '../../response';
import {
  arrayBufferToBase64,
  arrayBufferToString,
  splitCookiesString,
} from '../../utils';

export type AlbEvent = ALBEvent;
export type AlbResponse = ALBResult;

export function isAlbEvent(event: unknown): event is AlbEvent {
  return typeof event === 'object' &&
         event !== null &&
         'requestContext' in event &&
         typeof event.requestContext === 'object' &&
         event.requestContext !== null &&
         'elb' in event.requestContext;
}

export function requestMethod(event: AlbEvent) {
  return event.httpMethod;
}

export function requestRemoteAddress(event: AlbEvent) {
  return event.requestContext?.elb?.targetGroupArn || '';
}

export function requestHeaders(event: AlbEvent) {
  const headers = new Headers();

  if (event.multiValueHeaders) {
    for (const [key, values] of Object.entries(event.multiValueHeaders)) {
      if (values) {
        for (const value of values) {
          headers.append(key, value);
        }
      }
    }
  }

  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) {
        headers.set(key, value);
      } else {
        headers.delete(key);
      }
    }
  }

  return headers;
}

export function requestBody(event: AlbEvent): ArrayBuffer | string | undefined {
  if (event.body === undefined || event.body === null) {
    return;
  }

  if (event.isBase64Encoded) {
    return Buffer.from(event.body, 'base64');
  }

  return event.body;
}

export function requestUrl(event: AlbEvent) {
  const url = new URL(event.path, 'http://localhost');

  if (event.multiValueQueryStringParameters) {
    for (const [key, values] of Object.entries(event.multiValueQueryStringParameters)) {
      if (values) {
        for (const value of values) {
          url.searchParams.append(key, value);
        }
      }
    }
  }

  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    }
  }

  return url.href;
}

export function requestFromEvent(event: AlbEvent) {
  return new TsRestRequest(requestUrl(event), {
    method: requestMethod(event),
    headers: requestHeaders(event),
    body: requestBody(event),
  });
}

export async function responseToResult(
  response: TsRestResponse,
): Promise<AlbResponse> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};

  response.headers.forEach((value, key) => {
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;

    const multiValueHeaderValue =
      key === 'set-cookie'
        ? splitCookiesString(value)
        : value.split(',').map((v) => v.trim());

    multiValueHeaders[key] = multiValueHeaders[key]
      ? [...multiValueHeaders[key], ...multiValueHeaderValue]
      : multiValueHeaderValue;
  });

  let isBase64Encoded = false;
  let body: string;

  if (typeof response.rawBody === 'string' || response.rawBody === null) {
    body = response.rawBody ?? '';
  } else if (
    headers['content-type']?.startsWith('text/') ||
    (response.rawBody instanceof Blob &&
      response.rawBody.type.startsWith('text/'))
  ) {
    body = await arrayBufferToString(response.rawBody);
  } else {
    body = await arrayBufferToBase64(response.rawBody);
    isBase64Encoded = true;
  }

  return {
    statusCode: response.status,
    headers,
    multiValueHeaders,
    body,
    isBase64Encoded,
  };
}
