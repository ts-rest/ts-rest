import { initTsRest } from './dsl';
import {
  getAppRoutePathRoute,
  getPathParamsFromArray,
  getPathParamsFromUrl,
} from './server-utils';

const c = initTsRest();

describe('getAppRoutePathRoute', () => {
  it('should work for basic routes', () => {
    const appRoute = c.query({
      method: 'GET',
      path: () => `/posts`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const path = getAppRoutePathRoute(appRoute, {});

    expect(path).toStrictEqual('/posts');
  });

  it('should work for routes with path params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: ({ id }) => `/posts/${id}`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const path = getAppRoutePathRoute(appRoute, {});

    expect(path).toStrictEqual('/posts/:id');
  });

  it('should work for routes with many path params', () => {
    const appRoute = c.query({
      method: 'GET',
      path: ({ id, commentId }) => `/posts/${id}/comments/${commentId}`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const path = getAppRoutePathRoute(appRoute, {});

    expect(path).toStrictEqual('/posts/:id/comments/:commentId');
  });
});

describe('getPathParamsFromUrl', () => {
  it('should extract params from url', () => {
    const appRoute = c.query({
      method: 'GET',
      path: ({ id }) => `/posts/${id}`,
      query: null,
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
      path: ({ id, commentId }) => `/posts/${id}/comments/${commentId}`,
      query: null,
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
      path: ({ id }) => `/posts/${id}`,
      query: null,
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
      path: () => `/posts`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromUrl('/posts', appRoute);

    expect(pathParams).toStrictEqual({});
  });

  it('should fail gracefully if url doesnt match route', () => {
    const appRoute = c.query({
      method: 'GET',
      path: ({ id }) => `/posts/${id}`,
      query: null,
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
      path: ({ id }) => `/posts/${id}`,
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
      path: ({ id, commentId }) => `/posts/${id}/comments/${commentId}`,
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
      path: ({ id }) => `/posts/${id}`,
      query: null,
      responses: {
        200: c.response<{ message: string }>(),
      },
    });

    const pathParams = getPathParamsFromArray(['posts', '1'], appRoute);

    expect(pathParams).toStrictEqual({ id: '1' });
  });
});
