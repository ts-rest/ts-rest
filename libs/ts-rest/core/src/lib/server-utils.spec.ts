import { initTsRest } from './dsl';
import { getAppRoutePathRoute } from './server-utils';

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
