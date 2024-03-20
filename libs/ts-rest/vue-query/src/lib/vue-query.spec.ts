import { ApiFetcher, initContract } from '@ts-rest/core';
import { z } from 'zod';
import { initQueryClient } from './vue-query';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { createApp, unref } from 'vue';
import type { RenderHookResult } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/vue';

const act = (cb: () => {}) => cb();

const c = initContract();

export type Post = {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  published: boolean;
  authorId: string;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
};

const postsRouter = c.router(
  {
    getPost: {
      method: 'GET',
      path: `/posts/:id`,
      responses: {
        200: c.response<Post | null>(),
      },
    },
    getPosts: {
      method: 'GET',
      path: '/posts',
      responses: {
        200: c.response<Post[]>(),
      },
      query: z.object({
        take: z.number().optional(),
        skip: z.number().optional(),
      }),
    },
    createPost: {
      method: 'POST',
      path: '/posts',
      responses: {
        200: c.response<Post>(),
      },
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
        authorId: z.string(),
      }),
    },
    mutationWithQuery: {
      method: 'POST',
      path: '/posts',
      responses: {
        200: c.response<Post>(),
      },
      body: z.object({}),
      query: z.object({
        test: z.string(),
      }),
    },
    updatePost: {
      method: 'PUT',
      path: `/posts/:id`,
      responses: {
        200: c.response<Post>(),
      },
      body: z.object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
        description: z.string().optional(),
        authorId: z.string(),
      }),
    },
    patchPost: {
      method: 'PATCH',
      path: `/posts/:id`,
      responses: {
        200: c.response<Post>(),
      },
      body: null,
    },
    deletePost: {
      method: 'DELETE',
      path: `/posts/:id`,
      responses: {
        200: c.response<boolean>(),
      },
      body: null,
    },
    uploadImage: {
      method: 'POST',
      path: `/posts/:id/image`,
      responses: {
        200: c.response<Post>(),
      },
      contentType: 'multipart/form-data',
      body: c.body<{ image: File }>(),
    },
  },
  {
    baseHeaders: z.object({
      'x-test': z.string(),
    }),
  },
);

// Three endpoints, two for posts, and one for health
export const router = c.router({
  posts: postsRouter,
  health: {
    method: 'GET',
    path: '/health',
    responses: {
      200: c.response<{ message: string }>(),
    },
  },
});

const api = jest.fn();

const client = initQueryClient(router, {
  baseUrl: 'https://api.com',
  baseHeaders: {
    'x-test': 'test',
  },
  api: api as ApiFetcher,
});

const wrapper = () => document.createElement('div');

const SUCCESS_RESPONSE = {
  status: 200,
  body: {
    posts: [],
  },
};

const ERROR_RESPONSE = {
  status: 500,
  body: {
    message: 'Internal Server Error',
  },
};

function renderHook<Props, TResult>(
  composable: () => TResult,
  { wrapper }: { wrapper: () => Element },
): RenderHookResult<Props, TResult> {
  let result: TResult;

  const app = createApp({
    setup() {
      result = composable();
      // suppress missing template warning
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      return () => {};
    },
  });
  app.use(VueQueryPlugin).mount(wrapper());

  return {
    result: { all: [], current: result! },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    rerender: () => {},
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unmount: () => {},
    waitFor: () => Promise.resolve(),
    waitForNextUpdate: () => Promise.resolve(),
    waitForValueToChange: () => Promise.resolve(),
  };
}

describe('react-query', () => {
  beforeEach(() => {
    api.mockReset();
  });

  it('useQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(() => client.health.useQuery(['health']), {
      wrapper,
    });

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.health,
      signal: expect.any(AbortSignal),
    });

    await waitFor(() => {
      expect(unref(result.current.isLoading)).toStrictEqual(false);
    });

    expect(unref(result.current.data)).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQuery should accept extra headers', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQuery(['post', '1'], () => ({
          params: {
            id: '1',
          },
          headers: {
            'x-test': 'test',
          },
        })),
      {
        wrapper,
      },
    );

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it('useQuery should override base headers', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQuery(['post', '1'], () => ({
          params: {
            id: '1',
          },
          headers: {
            'x-test': 'foo',
          },
          extraHeaders: {
            'content-type': 'application/xml',
          },
        })),
      {
        wrapper,
      },
    );

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'content-type': 'application/xml',
        'x-test': 'foo',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it('useQuery should remove header if value is undefined', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQuery(['post', '1'], () => ({
          params: {
            id: '1',
          },
          extraHeaders: {
            'content-type': undefined,
          },
        })),
      {
        wrapper,
      },
    );

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it('useQuery should accept non-json string response', () => {
    api.mockResolvedValue({
      status: 200,
      body: 'Hello World',
    });

    const { result } = renderHook(() => client.health.useQuery(['health']), {
      wrapper,
    });

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.health,
      signal: expect.any(AbortSignal),
    });

    return waitFor(() => {
      expect(unref(result.current.isLoading)).toStrictEqual(false);
      expect(unref(result.current.data)).toStrictEqual({
        status: 200,
        body: 'Hello World',
      });
    });
  });

  it('useQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () =>
        client.health.useQuery(['health'], () => ({}), { retry: () => false }),
      { wrapper },
    );

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.health,
      signal: expect.any(AbortSignal),
    });

    await waitFor(() => {
      expect(unref(result.current.isLoading)).toStrictEqual(false);
    });

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.error)).toStrictEqual(ERROR_RESPONSE);
  });

  it('should handle mutation', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(() => client.posts.createPost.useMutation(), {
      wrapper,
    });

    expect(unref(result.current.data)).toStrictEqual(undefined);

    expect(unref(result.current.isLoading)).toStrictEqual(false);

    expect(unref(result.current.error)).toStrictEqual(null);

    await act(() =>
      result.current.mutateAsync({
        body: {
          description: 'test',
          title: 'test',
          content: '',
          authorId: '1',
        },
      }),
    );

    expect(api).toHaveBeenCalledWith({
      method: 'POST',
      path: 'https://api.com/posts',
      body: JSON.stringify({
        description: 'test',
        title: 'test',
        content: '',
        authorId: '1',
      }),
      headers: {
        'content-type': 'application/json',
        'x-test': 'test',
      },
      rawBody: {
        authorId: '1',
        content: '',
        description: 'test',
        title: 'test',
      },
      contentType: 'application/json',
      route: router.posts.createPost,
      signal: undefined,
    });

    await waitFor(() => {
      expect(unref(result.current.data)).not.toBeUndefined();
    });

    expect(unref(result.current.data)).toStrictEqual(SUCCESS_RESPONSE);
  });

  it.skip('useQueries should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              params: {
                id: '1',
              },
            },
            {
              queryKey: ['posts', '2'],
              params: {
                id: '2',
              },
            },
          ],
        }),
      {
        wrapper,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    await waitFor(() => {
      expect(result.current[0].isLoading).toStrictEqual(false);
    });

    await waitFor(() => {
      expect(result.current[1].isLoading).toStrictEqual(false);
    });

    expect(result.current[0].data).toStrictEqual(SUCCESS_RESPONSE);

    expect(result.current[1].data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it.skip('useQueries should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              params: {
                id: '1',
              },
              retry: false,
            },
            {
              queryKey: ['posts', '2'],
              params: {
                id: '2',
              },
              retry: false,
            },
          ],
        }),
      {
        wrapper,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    await waitFor(() => {
      expect(result.current[0].failureCount).toStrictEqual(1);
    });

    await waitFor(() => {
      expect(result.current[1].failureCount).toStrictEqual(1);
    });

    expect(result.current[0].data).toStrictEqual(undefined);
    expect(result.current[0].error).toStrictEqual(ERROR_RESPONSE);

    expect(result.current[1].data).toStrictEqual(undefined);
    expect(result.current[1].error).toStrictEqual(ERROR_RESPONSE);
  });

  it.skip('useQueries should handle success and failure', async () => {
    api
      .mockResolvedValueOnce(SUCCESS_RESPONSE)
      .mockResolvedValueOnce(ERROR_RESPONSE);

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              params: {
                id: '1',
              },
              retry: false,
            },
            {
              queryKey: ['posts', '2'],
              params: {
                id: '2',
              },
              retry: false,
            },
          ],
        }),
      {
        wrapper,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });

    await waitFor(() => {
      expect(result.current[0].isLoading).toStrictEqual(false);
    });

    await waitFor(() => {
      expect(result.current[1].isLoading).toStrictEqual(false);
    });

    expect(result.current[0].data).toStrictEqual(SUCCESS_RESPONSE);

    expect(result.current[1].data).toStrictEqual(undefined);
    expect(result.current[1].error).toStrictEqual(ERROR_RESPONSE);
  });

  it.skip('fetchQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        const queryClient = useQueryClient();
        return client.posts.getPost.fetchQuery(queryClient, ['post', '1'], {
          params: {
            id: '1',
          },
        });
      },
      {
        wrapper,
      },
    );

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it.skip('fetchQuery should handle success hook', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        const apiQueryClient = useTsRestQueryClient(client);
        return apiQueryClient.posts.getPost.fetchQuery(['post', '1'], {
          params: {
            id: '1',
          },
        });
      },
      {
        wrapper,
      },
    );

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it.skip('fetchQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      async () => {
        const apiQueryClient = useTsRestQueryClient(client);
        try {
          await apiQueryClient.posts.getPost.fetchQuery(['post', '1'], {
            params: {
              id: '1',
            },
          });
        } catch (error) {
          return error;
        }
      },
      {
        wrapper,
      },
    );

    expect(result.current).resolves.toStrictEqual(ERROR_RESPONSE);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it.skip('prefetchQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        const apiQueryClient = useTsRestQueryClient(client);
        return apiQueryClient.posts.getPost.prefetchQuery(['post', '1'], {
          params: {
            id: '1',
          },
        });
      },
      {
        wrapper,
      },
    );

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it.skip('getQueryData should return already fetched data', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { waitForNextUpdate } = renderHook(
      () => {
        const { data } = client.posts.getPost.useQuery(['post', '1'], () => ({
          params: {
            id: '1',
          },
        }));

        return data;
      },
      {
        wrapper,
      },
    );

    await waitForNextUpdate();

    const { result } = renderHook(
      () => {
        const apiQueryClient = useTsRestQueryClient(client);
        return apiQueryClient.posts.getPost.getQueryData(['post', '1']);
      },
      {
        wrapper,
      },
    );

    expect(result.current).toStrictEqual(SUCCESS_RESPONSE);

    expect(api).toHaveBeenCalledTimes(1);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: router.posts.getPost,
      signal: expect.any(AbortSignal),
    });
  });

  it.skip('setQueryData should overwrite data returned from api', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const data = {
      status: 200,
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
      body: {
        id: '1',
        title: 'foo',
        description: 'bar',
        authorId: '1',
        content: 'baz',
        published: true,
      } as Post,
    } as const;

    const { waitForNextUpdate } = renderHook(
      () =>
        client.posts.getPost.useQuery(
          ['post', '1'],
          () => ({
            params: {
              id: '1',
            },
          }),
          {
            staleTime: 10000,
          },
        ),
      {
        wrapper,
      },
    );

    await waitForNextUpdate();

    renderHook(
      () => {
        const apiQueryClient = useTsRestQueryClient(client);
        return apiQueryClient.posts.getPost.setQueryData(['post', '1'], data);
      },
      {
        wrapper,
      },
    );

    const { result } = renderHook(
      () =>
        client.posts.getPost.useQuery(
          ['post', '1'],
          () => ({
            params: {
              id: '1',
            },
          }),
          {
            staleTime: 10000,
          },
        ),
      {
        wrapper,
      },
    );

    return waitFor(() => {
      expect(unref(result.current.isLoading)).toStrictEqual(false);
      expect(unref(result.current.data)).toStrictEqual(data);
    });
  });
});
