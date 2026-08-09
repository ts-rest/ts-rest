import { initContract } from './dsl';
import type { InferHeadersInput, InferHeadersOutput } from './dsl';
import type { ServerInferRequest } from './infer-types';

describe('object-based header inference', () => {
  const c = initContract();

  const contract = c.router({
    example: {
      method: 'GET',
      path: '/example',
      headers: {
        'X-Request-Id': c.type<string>(),
        'If-Match': c.type<number>(),
      },
      responses: {
        200: c.type<null>(),
      },
    },
  });

  type Route = typeof contract.example;

  it('preserves output types and lowercases header names', () => {
    type Headers = InferHeadersOutput<Route>;
    type Request = ServerInferRequest<Route>;

    const assertOutput = (headers: Headers) => {
      const requestId: string = headers['x-request-id'];
      const ifMatch: number = headers['if-match'];

      return { ifMatch, requestId };
    };

    const assertRequest = (headers: Request['headers']) => {
      const requestId: string = headers['x-request-id'];
      const ifMatch: number = headers['if-match'];

      return { ifMatch, requestId };
    };

    expect(typeof assertOutput).toBe('function');
    expect(typeof assertRequest).toBe('function');
  });

  it('preserves input types and lowercases header names', () => {
    type Headers = InferHeadersInput<Route>;

    const assertInput = (headers: Headers) => {
      const requestId: string = headers['x-request-id'];
      const ifMatch: number = headers['if-match'];

      return { ifMatch, requestId };
    };

    expect(typeof assertInput).toBe('function');
  });
});
