import { TextEncoder } from 'util';
import type {
  APIGatewayEventRequestContextV2,
  APIGatewayProxyEventV2WithRequestContext,
  // APIGatewayProxyResult,
  APIGatewayProxyEventBase,
} from 'aws-lambda';
import { TsRestRequest } from '../../request';
import { parseQueryString } from '../../query';

type EventV1 = APIGatewayProxyEventBase<unknown>;
type EventV2 =
  APIGatewayProxyEventV2WithRequestContext<APIGatewayEventRequestContextV2>;

export function isV2(event: EventV1 | EventV2): event is EventV2 {
  return 'version' in event && event.version === '2.0';
}

export function requestMethod(event: EventV1 | EventV2) {
  if (isV2(event)) {
    return event.requestContext.http.method;
  }
  return event.httpMethod;
}

export function requestRemoteAddress(event: EventV1 | EventV2) {
  if (isV2(event)) {
    return event.requestContext.http.sourceIp;
  }
  return event.requestContext.identity.sourceIp;
}

export function requestHeaders(event: EventV1 | EventV2) {
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

export function requestBody(event: EventV1 | EventV2): ArrayBuffer {
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

export function requestUrl(event: EventV1 | EventV2) {
  if (isV2(event)) {
    return {
      path: event.rawPath,
      queryString: event.rawQueryString,
    };
  }

  const url = new URL(event.path, 'https://ts-rest.com');

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

  return {
    path: url.pathname,
    queryString:
      url.search.indexOf('?') === 0 ? url.search.slice(1) : url.search,
  };
}

export function requestFromEvent(event: EventV1 | EventV2) {
  const { path, queryString } = requestUrl(event);

  return new TsRestRequest({
    path,
    remoteAddress: requestRemoteAddress(event),
    method: requestMethod(event),
    query: parseQueryString(queryString),
    headers: requestHeaders(event),
    body: requestBody(event),
  });
}
