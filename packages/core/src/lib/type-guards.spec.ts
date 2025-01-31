import {
  isResponse,
  isSuccessResponse,
  isErrorResponse,
  isUnknownResponse,
  isUnknownSuccessResponse,
  isUnknownErrorResponse,
} from './type-guards';
import { initContract } from './dsl';
import { Equal, Expect } from './test-helpers';
import {
  ErrorHttpStatusCode,
  HTTPStatusCode,
  SuccessfulHttpStatusCode,
} from './status-codes';

const c = initContract();

describe('Type Guards', () => {
  const contract = c.router({
    getPost: {
      method: 'GET',
      path: '/posts/:id',
      responses: {
        200: c.type<{ id: string }>(),
        404: c.type<{ message: string }>(),
      },
    },
    getPostStrict: {
      method: 'GET',
      path: '/posts/:id',
      responses: {
        200: c.type<{ id: string }>(),
        404: c.type<{ message: string }>(),
      },
      strictStatusCodes: true,
    },
  });

  type ResponseType = {
    status: number;
    body: unknown;
    headers: Headers;
  };

  const errorObject = new Error('Error');

  const successResponse: ResponseType = {
    status: 200,
    body: {
      id: '1',
    },
    headers: new Headers(),
  };

  const errorResponse: ResponseType = {
    status: 404,
    body: {
      message: 'Not Found',
    },
    headers: new Headers(),
  };

  const unknownSuccessResponse: ResponseType = {
    status: 207,
    body: 'Success',
    headers: new Headers(),
  };

  const unknownErrorResponse: ResponseType = {
    status: 500,
    body: 'Server Error',
    headers: new Headers(),
  };

  describe('isResponse', () => {
    it.each([
      successResponse,
      errorResponse,
      unknownSuccessResponse,
      unknownErrorResponse,
    ])('should return true for a valid response object', (response) => {
      const result = isResponse(response, contract.getPost);
      expect(result).toStrictEqual(true);

      if (result) {
        type TypeTest = Expect<
          Equal<
            typeof response,
            | { status: 200; body: { id: string }; headers: Headers }
            | { status: 404; body: { message: string }; headers: Headers }
            | {
                status: Exclude<HTTPStatusCode, 200 | 404>;
                body: unknown;
                headers: Headers;
              }
          >
        >;
      }
    });

    it.each([successResponse, errorResponse])(
      '[strictStatusCode] should return true for a valid defined response object',
      (response) => {
        const result = isResponse(response, contract.getPostStrict);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              | { status: 200; body: { id: string }; headers: Headers }
              | { status: 404; body: { message: string }; headers: Headers }
            >
          >;
        }
      },
    );

    it.each([
      errorObject,
      null,
      {},
      { status: 200, noBody: '' },
      { status: 200 },
    ])('should return false for an invalid response object', (response) => {
      expect(isResponse(response)).toBe(false);
    });

    it.each([
      unknownSuccessResponse,
      unknownErrorResponse,
      errorObject,
      null,
      {},
      { status: 200, noBody: '' },
      { status: 200 },
    ])(
      '[strictStatusCode] should return false for an invalid response object or undefined response',
      (response) => {
        expect(isResponse(response, contract.getPostStrict)).toBe(false);
      },
    );
  });

  describe('isSuccessResponse', () => {
    it.each([successResponse, unknownSuccessResponse])(
      'should return true for a successful response',
      (response) => {
        const result = isSuccessResponse(response, contract.getPost);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              | { status: 200; body: { id: string }; headers: Headers }
              | {
                  status: Exclude<SuccessfulHttpStatusCode, 200>;
                  body: unknown;
                  headers: Headers;
                }
            >
          >;
        }
      },
    );

    it.each([successResponse])(
      '[strictStatusCode] should return true for a successful response',
      (response) => {
        const result = isSuccessResponse(response, contract.getPostStrict);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              { status: 200; body: { id: string }; headers: Headers }
            >
          >;
        }
      },
    );

    it.each([errorResponse, unknownErrorResponse])(
      'should return false for a non-successful response',
      (response) => {
        expect(isSuccessResponse(response)).toStrictEqual(false);
      },
    );

    it.each([unknownSuccessResponse, errorResponse, unknownErrorResponse])(
      'should return false for a non-successful response',
      (response) => {
        expect(
          isSuccessResponse(response, contract.getPostStrict),
        ).toStrictEqual(false);
      },
    );
  });

  describe('isErrorResponse', () => {
    it.each([errorResponse, unknownErrorResponse])(
      'should return true for an error response',
      (response) => {
        const result = isErrorResponse(response, contract.getPost);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              | { status: 404; body: { message: string }; headers: Headers }
              | {
                  status: Exclude<ErrorHttpStatusCode, 404>;
                  body: unknown;
                  headers: Headers;
                }
            >
          >;
        }
      },
    );

    it.each([errorResponse])(
      '[strictStatusCode] should return true for an error response',
      (response) => {
        const result = isErrorResponse(response, contract.getPostStrict);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              { status: 404; body: { message: string }; headers: Headers }
            >
          >;
        }
      },
    );

    it.each([successResponse, unknownSuccessResponse])(
      'should return false for a non-error response',
      (response) => {
        expect(isErrorResponse(response)).toStrictEqual(false);
      },
    );

    it.each([unknownErrorResponse, successResponse, unknownSuccessResponse])(
      'should return false for a non-error response',
      (response) => {
        expect(isErrorResponse(response, contract.getPostStrict)).toStrictEqual(
          false,
        );
      },
    );
  });

  describe('isUnknownResponse', () => {
    it.each([unknownSuccessResponse, unknownErrorResponse])(
      'should return true for responses not defined in the contract',
      (response) => {
        const result = isUnknownResponse(response, contract.getPost);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              {
                status: Exclude<HTTPStatusCode, 200 | 404>;
                body: unknown;
                headers: Headers;
              }
            >
          >;
        }
      },
    );

    it.each([successResponse, errorResponse])(
      'should return false for a response defined in the contract',
      (response) => {
        expect(isUnknownResponse(response, contract.getPost)).toStrictEqual(
          false,
        );
      },
    );
  });

  describe('isUnknownSuccessResponse', () => {
    it.each([unknownSuccessResponse])(
      'should return true for successful responses not defined in the contract or error responses',
      (response) => {
        const result = isUnknownSuccessResponse(response, contract.getPost);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              {
                status: Exclude<SuccessfulHttpStatusCode, 200>;
                body: unknown;
                headers: Headers;
              }
            >
          >;
        }
      },
    );

    it.each([successResponse, errorResponse, unknownErrorResponse])(
      'should return false for a success response defined in the contract or non-success responses',
      (response) => {
        expect(
          isUnknownSuccessResponse(response, contract.getPost),
        ).toStrictEqual(false);
      },
    );
  });

  describe('isUnknownErrorResponse', () => {
    it.each([unknownErrorResponse])(
      'should return true for error responses not defined in the contract or successful responses',
      (response) => {
        const result = isUnknownErrorResponse(response, contract.getPost);
        expect(result).toStrictEqual(true);

        if (result) {
          type TypeTest = Expect<
            Equal<
              typeof response,
              {
                status: Exclude<ErrorHttpStatusCode, 404>;
                body: unknown;
                headers: Headers;
              }
            >
          >;
        }
      },
    );

    it.each([errorResponse, successResponse, unknownSuccessResponse])(
      'should return false for an error response defined in the contract or non-error responses',
      (response) => {
        expect(
          isUnknownErrorResponse(response, contract.getPost),
        ).toStrictEqual(false);
      },
    );
  });
});
