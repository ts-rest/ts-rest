import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
} from 'aws-lambda';
import { TsRestRequest } from '../../request';
import { TsRestResponse } from '../../response';

type EventV1 = APIGatewayProxyEvent;
type EventV2 = APIGatewayProxyEventV2;
export type ApiGatewayEvent = EventV1 | EventV2;
export type ApiGatewayResponse =
  | APIGatewayProxyResult
  | APIGatewayProxyResultV2;

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

export function requestBody(
  event: ApiGatewayEvent
): ArrayBuffer | string | undefined {
  if (event.body === undefined || event.body === null) {
    return;
  }

  if (Buffer.isBuffer(event.body)) {
    return event.body.buffer;
  } else if (typeof event.body === 'string') {
    if (event.isBase64Encoded) {
      return Uint8Array.from(atob(event.body), (c) => c.charCodeAt(0));
    }
    return event.body;
  } else if (typeof event.body === 'object') {
    return JSON.stringify(event.body);
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
  return new TsRestRequest(requestUrl(event), {
    method: requestMethod(event),
    url: requestUrl(event),
    headers: requestHeaders(event),
    body: requestBody(event),
  });
}

async function arrayBufferToBase64(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const [, base64] = (reader.result as string).split(',');
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

async function arrayBufferToString(bufferOrBlob: ArrayBuffer | Blob) {
  const blob =
    bufferOrBlob instanceof Blob ? bufferOrBlob : new Blob([bufferOrBlob]);
  return await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsText(blob);
  });
}

export async function responseToResult(
  event: ApiGatewayEvent,
  response: TsRestResponse
): Promise<ApiGatewayResponse> {
  const { headers, multiValueHeaders } = Object.entries(
    response.headers
  ).reduce(
    (headerDto, [key, value]) => {
      const normalizedKey = key.toLowerCase();

      if (Array.isArray(value)) {
        headerDto.multiValueHeaders[normalizedKey] = value;

        if (normalizedKey !== 'set-cookie') {
          headerDto.headers[normalizedKey] = value.join(', ');
        }
      } else {
        headerDto.headers[key] = value;
      }

      return headerDto;
    },
    {
      headers: {} as Record<string, string>,
      multiValueHeaders: {} as Record<string, string[]>,
    }
  );

  let cookies = [] as string[];

  if (multiValueHeaders['set-cookie']) {
    cookies = multiValueHeaders['set-cookie'];
  }

  const isTextContentType =
    headers['content-type']?.startsWith('text/') ||
    (response.body instanceof Blob && response.body.type.startsWith('text/'));

  const isBase64Encoded =
    typeof response.body !== 'string' && !isTextContentType;

  const body = await (async () => {
    if (typeof response.body === 'string') {
      return response.body;
    }

    if (isTextContentType) {
      return arrayBufferToString(response.body);
    }

    return arrayBufferToBase64(response.body);
  })();

  if (isV2(event)) {
    return {
      statusCode: response.statusCode,
      headers,
      body,
      ...(cookies.length && { cookies }),
      isBase64Encoded,
    } satisfies APIGatewayProxyResultV2;
  }

  return {
    statusCode: response.statusCode,
    headers,
    ...(Object.keys(multiValueHeaders).length && { multiValueHeaders }),
    body,
    isBase64Encoded,
  } satisfies APIGatewayProxyResult;
}
