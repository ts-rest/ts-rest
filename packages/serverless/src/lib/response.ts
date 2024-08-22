type BodyInit = string | ArrayBuffer | Blob | null;

export class TsRestResponse extends Response {
  public rawBody: BodyInit;

  constructor(body: BodyInit, init?: ResponseInit) {
    super(body, init);

    this.rawBody = body;
  }

  static fromJson(json: any, init?: ResponseInit) {
    const headers =
      init?.headers instanceof Headers
        ? init.headers
        : new Headers(init?.headers);

    headers.set('content-type', 'application/json');
    return new TsRestResponse(JSON.stringify(json), {
      ...init,
      headers,
    });
  }

  static fromText(text: string, init?: ResponseInit) {
    const headers =
      init?.headers instanceof Headers
        ? init.headers
        : new Headers(init?.headers);

    headers.set('content-type', 'text/plain');
    return new TsRestResponse(text, {
      ...init,
      headers,
    });
  }

  // @ts-expect-error - undici-types exposes clone as a property and not a method
  override clone() {
    return new TsRestResponse(this.rawBody, this);
  }
}
