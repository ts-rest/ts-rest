import { initContract } from './dsl';
import { getPathParamsFromArray, getPathParamsFromUrl } from './server-utils';

const c = initContract();

describe('getPathParamsFromUrl', () => {
  it('should extract params from url', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl('/posts/1', appRoute);

    expect(pathParams).toStrictEqual({ id: '1' });
  });

  it('should extract params from url with many path params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id/comments/:commentId`,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl('/posts/1/comments/2', appRoute);

    expect(pathParams).toStrictEqual({ id: '1', commentId: '2' });
  });

  it('should ignore any query params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl(
      '/posts/1?unwanted-query-param=true',
      appRoute
    );

    expect(pathParams).toStrictEqual({ id: '1' });
  });

  it('should return empty object if no path params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts`,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl('/posts', appRoute);

    expect(pathParams).toStrictEqual({});
  });

  it(`should fail gracefully if url doesn't match route`, () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl('/posts', appRoute);

    expect(pathParams).toStrictEqual({});
  });
});

describe('getPathParamsFromArray', () => {
  it('should extract params from array', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
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
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(
      ['posts', '1', 'comments', '2'],
      appRoute
    );

    expect(pathParams).toStrictEqual({ id: '1', commentId: '2' });
  });
  it('should ignore any query params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: `/posts/:id`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(['posts', '1'], appRoute);

    expect(pathParams).toStrictEqual({ id: '1' });
  });
});
