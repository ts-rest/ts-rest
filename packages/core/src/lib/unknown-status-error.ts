export class UnknownStatusError extends Error {
  response: { status: number; body: unknown };

  constructor(
    response: { status: number; body: unknown },
    knownResponseStatuses: string[],
  ) {
    const expectedStatuses = knownResponseStatuses.join(',');
    super(
      `Server returned unexpected response. Expected one of: ${expectedStatuses} got: ${response.status}`,
    );

    this.response = response;
  }
}
