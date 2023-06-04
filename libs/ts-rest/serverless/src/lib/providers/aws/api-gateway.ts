import { TextEncoder } from 'util';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  // APIGatewayProxyResult,
} from 'aws-lambda';
import { TsRestRequest } from '../../request';

type EventV1 = APIGatewayProxyEvent;
type EventV2 = APIGatewayProxyEventV2;
export type ApiGatewayEvent = EventV1 | EventV2;

export function isV2(event: ApiGatewayEvent): event is EventV2 {
  return 'version' in event && event.version === '2.0';
}

export function requestMethod(event: ApiGatewayEvent) {
  if (isV2(event)) {
    return event.requestContext.http.method;
  }
  return event.httpMethod;
}

export function requestRemoteAddress(event: ApiGatewayEvent) {
  if (isV2(event)) {
    return event.requestContext.http.sourceIp;
  }
  return event.requestContext.identity.sourceIp;
}

export function requestHeaders(event: ApiGatewayEvent) {
  const headers = new Headers();

  if (isV2(event) && event.cookies?.length) {
    headers.set('cookie', event.cookies.join('; '));
  }

  if ('multiValueHeaders' in event && event.multiValueHeaders) {
    Object.entries(event.multiValueHeaders).forEach(([key, values]) => {
      values?.forEach((value) => {
        headers.append(key, value);
      });
    });
  }

  if ('headers' in event && event.headers) {
    Object.entries(event.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, value);
      } else {
        headers.delete(key);
      }
    });
  }

  return headers;
}

export function requestBody(event: ApiGatewayEvent): ArrayBuffer {
  if (event.body === undefined || event.body === null) {
    return new ArrayBuffer(0);
  }

  if (Buffer.isBuffer(event.body)) {
    return event.body.buffer;
  } else if (typeof event.body === 'string') {
    if (event.isBase64Encoded) {
      return Uint8Array.from(atob(event.body), (c) => c.charCodeAt(0));
    }
    return new TextEncoder().encode(event.body);
  } else if (typeof event.body === 'object') {
    return new TextEncoder().encode(JSON.stringify(event.body));
  }

  throw new Error(`Unexpected event.body type: ${typeof event.body}`);
}

export function requestUrl(event: ApiGatewayEvent) {
  if (isV2(event)) {
    const url = new URL(event.rawPath, 'http://localhost');
    url.search = event.rawQueryString;

    return url.href;
  }

  const url = new URL(event.path, 'http://localhost');

  if (event.multiValueQueryStringParameters) {
    Object.entries(event.multiValueQueryStringParameters).forEach(
      ([key, values]) => {
        values?.forEach((value) => {
          url.searchParams.append(key, value);
        });
      }
    );
  }

  if (event.queryStringParameters) {
    Object.entries(event.queryStringParameters).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
  }

  return url.href;
}

export function requestFromEvent(event: ApiGatewayEvent) {
  return new TsRestRequest({
    method: requestMethod(event),
    url: requestUrl(event),
    headers: requestHeaders(event),
    body: requestBody(event),
  });
}
