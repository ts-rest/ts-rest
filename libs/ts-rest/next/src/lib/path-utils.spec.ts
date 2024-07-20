import { initContract } from '@ts-rest/core';
import { getPathParamsFromArray } from './path-utils';

const c = initContract();

describe('getPathParamsFromArray', () => {
  it('should extract params from array', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      query: null,
      responses: {
        200: c.type<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(['posts', '1'], appRoute);

    expect(pathParams).toStrictEqual({ id: '1' });
  });

  it('should extract params from array with many path params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id/comments/:commentId`,
      query: null,
      responses: {
        200: c.type<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(
      ['posts', '1', 'comments', '2'],
      appRoute,
    );

    expect(pathParams).toStrictEqual({ id: '1', commentId: '2' });
  });
  it('should ignore any query params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      query: null,
      responses: {
        200: c.type<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(['posts', '1'], appRoute);

    expect(pathParams).toStrictEqual({ id: '1' });
  });
});
