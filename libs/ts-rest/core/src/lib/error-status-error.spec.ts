import { initContract } from './dsl';
import {
  ErrorStatusResponseError,
  isErrorStatusResponse,
} from './error-status-error';

const c = initContract();
const router = c.router({
  health: {
    method: 'GET',
    path: '/health',
    responses: {
      200: c.type<{ message: string }>(),
      401: c.type<{ message: 'unauthorized' }>(),
      403: c.type<{ message: 'forbidden' }>(),
      500: c.type<{ message: 'server error' }>(),
    },
  },
  other: {
    method: 'GET',
    path: '/other',
    responses: {
      200: c.type<{ message: string }>(),
      401: c.type<{ message: 'unauthorized' }>(),
    },
  },
});

const unauthorizedHealthError: Error = new ErrorStatusResponseError(
  router.health,
  {
    status: 401,
    body: { message: 'unauthorized' },
    headers: new Headers(),
  },
  { url: '/health' },
);
const internalServerHealthError: Error = new ErrorStatusResponseError(
  router.health,
  {
    status: 500,
    body: { message: 'server error' },
    headers: new Headers(),
  },
  { url: '/health' },
);

describe('ErrorStatusError', () => {
  it('should be unauthorized health error and have the correct response body', () => {
    const isHealthError = isErrorStatusResponse(
      unauthorizedHealthError,
      router.health,
      401,
    );

    if (!isHealthError) fail('should be health error');
    expect(unauthorizedHealthError.response.body.message).toEqual(
      'unauthorized',
    );
  });

  it('should have correct error status code check', () => {
    expect(
      isErrorStatusResponse(internalServerHealthError, router.health, 401),
    ).toBe(false);
    expect(
      isErrorStatusResponse(internalServerHealthError, router.health, 500),
    ).toBe(true);
  });

  it('should check for array of error code statuses', () => {
    const isHealthError = isErrorStatusResponse(
      unauthorizedHealthError,
      router.health,
      [401, 403, 500],
    );

    if (!isHealthError) fail('should be health error');
    expect(unauthorizedHealthError.response.body.message).toEqual(
      'unauthorized',
    );
  });

  it('should check for not provided error code status', () => {
    const isHealthError = isErrorStatusResponse(
      unauthorizedHealthError,
      router.health,
    );

    if (!isHealthError) fail('should be health error');
    expect(unauthorizedHealthError.response.body).toStrictEqual({
      message: 'unauthorized',
    });
  });

  it('should check error is not from health error response', () => {
    const error = new ErrorStatusResponseError(
      router.health,
      {
        status: 500,
        body: { message: 'server error' },
        headers: new Headers(),
      },
      { url: '/health' },
    );

    expect(isErrorStatusResponse(error, router.other, 401)).toBe(false);
    expect(isErrorStatusResponse(error, router.health, 500)).toBe(true);
  });
});
