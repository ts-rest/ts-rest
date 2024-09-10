import { HttpRequest, HttpResponse } from '@azure/functions';
import { TsRestRequest } from '../../request';
import { TsRestResponse } from '../../response';
import { arrayBufferToBase64, arrayBufferToString } from '../../utils';

export async function requestFromHttpRequest(httpRequest: HttpRequest) {
  let body;

  if (httpRequest.body) {
    body = await httpRequest.text();
  }

  return new TsRestRequest(httpRequest.url, {
    method: httpRequest.method,
    headers: httpRequest.headers as Headers,
    body,
  });
}

export async function responseToHttpResponse(
  response: TsRestResponse,
): Promise<HttpResponse> {
  const headers = {} as Record<string, string>;

  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let body: string | undefined;

  if (typeof response.rawBody === 'string' || response.rawBody === null) {
    body = response.rawBody ?? undefined;
  } else if (
    headers['content-type']?.startsWith('text/') ||
    (response.rawBody instanceof Blob &&
      response.rawBody.type.startsWith('text/'))
  ) {
    body = await arrayBufferToString(response.rawBody);
  } else {
    body = await arrayBufferToBase64(response.rawBody);
  }

  return new HttpResponse({
    status: response.status,
    headers,
    body,
  });
}
