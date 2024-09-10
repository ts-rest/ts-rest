import { initContract, ResponseValidationError, validateResponse } from '..';
import { z } from 'zod';

const c = initContract();
const contract = c.router(
  {
    plainResponse: {
      method: 'GET',
      path: `/plain`,
      responses: {
        200: c.type<{ foo: string }>(),
      },
    },
    zodResponse: {
      method: 'GET',
      path: '/zod',
      responses: {
        200: z.object({
          foo: z.string().transform((val) => val.toUpperCase()),
        }),
      },
    },
    overrideCommonResponse: {
      method: 'GET',
      path: '/override-common',
      responses: {
        200: z.object({
          foo: z.string(),
        }),
        400: z.object({
          foo: z.string(),
        }),
      },
    },
  },
  {
    commonResponses: {
      400: z.object({
        message: z.literal('Bad Request'),
      }),
      404: z.object({
        message: z.literal('Not Found'),
      }),
    },
  },
);

describe('server', () => {
  it('succeeds validation on plain type', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 200,
        body: { anything: 'foo' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 200,
      body: { anything: 'foo' },
    });
  });

  it('succeeds validation on non-existent status code', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 500,
        body: { anything: 'foo' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 500,
      body: { anything: 'foo' },
    });
  });

  it('succeeds validation on zod response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.zodResponse,
      response: {
        status: 200,
        body: { foo: 'bar' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 200,
      body: { foo: 'BAR' },
    });
  });

  it('fails validation on zod response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.zodResponse,
        response: {
          status: 200,
          body: { bar: 'foo' },
        },
      });
    }).toThrow(ResponseValidationError);
  });

  it('succeeds validation on zod common response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.plainResponse,
      response: {
        status: 400,
        body: { message: 'Bad Request' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 400,
      body: { message: 'Bad Request' },
    });
  });

  it('fails validation on zod common response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.plainResponse,
        response: {
          status: 400,
          body: { message: 'not bad request' },
        },
      });
    }).toThrow(ResponseValidationError);
  });

  it('succeeds validation on overridden zod common response', () => {
    const validatedResponse = validateResponse({
      appRoute: contract.overrideCommonResponse,
      response: {
        status: 400,
        body: { foo: 'bar' },
      },
    });

    expect(validatedResponse).toEqual({
      status: 400,
      body: { foo: 'bar' },
    });
  });

  it('fails validation on overridden zod common response', () => {
    expect(() => {
      validateResponse({
        appRoute: contract.overrideCommonResponse,
        response: {
          status: 400,
          body: { message: 'Bad Request' },
        },
      });
    }).toThrow(ResponseValidationError);
  });
});
