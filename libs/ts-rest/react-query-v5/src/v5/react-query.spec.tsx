import '@testing-library/jest-dom';
import {
  QueryClient,
  QueryClientProvider,
  skipToken,
} from '@tanstack/react-query';
import {
  waitFor,
  renderHook,
  screen,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import { ApiFetcher, initContract } from '@ts-rest/core';
import * as React from 'react';
import { act } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { z } from 'zod';
import { initTsrReactQuery } from './init-tsr-react-query';
import {
  isFetchError,
  isNotKnownResponseError,
  isUnknownErrorResponse,
  exhaustiveGuard,
} from './type-guards';

// mute errors at ErrorBoundary when using suspense functions
window.addEventListener('error', (event) => {
  event.preventDefault();
});

const noop = (...args: any[]) => {};

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
        200: c.type<Post>(),
        404: c.type<{ message: 'not found' }>(),
      },
    },
    getPosts: {
      method: 'GET',
      path: '/posts',
      responses: {
        200: c.type<{ posts: Post[] }>(),
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
        200: c.type<Post>(),
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
        200: c.type<Post>(),
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
        200: c.type<Post>(),
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
        200: c.type<Post>(),
      },
      body: null,
    },
    deletePost: {
      method: 'DELETE',
      path: `/posts/:id`,
      responses: {
        200: c.type<boolean>(),
      },
      body: null,
    },
    uploadImage: {
      method: 'POST',
      path: `/posts/:id/image`,
      responses: {
        200: c.type<Post>(),
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
const contract = c.router({
  posts: postsRouter,
  health: {
    method: 'GET',
    path: '/health',
    responses: {
      200: c.type<{ message: string }>(),
    },
  },
});

const api = jest.fn();

let queryClient = new QueryClient();

const tsr = initTsrReactQuery(contract, {
  baseUrl: 'https://api.com',
  baseHeaders: {
    'x-test': 'test',
  },
  api: api as ApiFetcher,
});

const ReactQueryProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <ErrorBoundary
          fallbackRender={({ error }) => (
            <p>{error?.body?.message || error?.message || 'Error'}</p>
          )}
        >
          <React.Suspense fallback={<p>loading</p>}>{children}</React.Suspense>
        </ErrorBoundary>
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

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

describe('react-query', () => {
  beforeEach(() => {
    queryClient = new QueryClient();
    api.mockReset();
  });

  it('useQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.health.useQuery({
          queryKey: ['health'],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);
    expect(result.current.isPending).toStrictEqual(true);
    expect(result.current.contractEndpoint).toEqual(contract.health);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQuery should handle skipToken', async () => {
    const { result } = renderHook(
      () => {
        return tsr.health.useQuery({
          queryKey: ['health'],
          queryData: skipToken,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(true);
    });

    expect(result.current.data).toStrictEqual(undefined);
    expect(api).toHaveBeenCalledTimes(0);
  });

  it('useQuery should handle error response', async () => {
    api.mockResolvedValue({
      status: 404,
      body: { message: 'not found' },
    });

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['posts', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
          retry: false,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );
    expect(result.current.contractEndpoint).toEqual(contract.posts.getPost);

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    const useQueryResult = result.current;

    expect(useQueryResult.error).toEqual({
      status: 404,
      body: { message: 'not found' },
    });

    if (useQueryResult.isPending) {
      throw new Error('isPending should be false');
    }

    try {
      // @ts-expect-error - `error` could be `Error` exception
      noop(useQueryResult.error.body.message);
    } catch {
      /* empty */
    }

    if (useQueryResult.isError) {
      if (
        !isNotKnownResponseError(
          useQueryResult.error,
          useQueryResult.contractEndpoint,
        )
      ) {
        // excluded both `Error` type and unknown responses
        noop(useQueryResult.error.body.message);
      }

      try {
        // @ts-expect-error - `error` could be `Error` exception
        noop(useQueryResult.error.body.message);
      } catch {
        /* empty */
      }

      if (isFetchError(useQueryResult.error)) {
        throw new Error(
          'useQueryResult.error should be a response, got `Error` instead',
        );
      }

      try {
        // @ts-expect-error - `status` could be one that is undefined in contract, so `body` is unknown
        noop(useQueryResult.error.body.message);
      } catch {
        /* empty */
      }

      if (
        isUnknownErrorResponse(
          useQueryResult.error,
          result.current.contractEndpoint,
        )
      ) {
        throw new Error(
          `useQueryResult.status should be 404, got ${useQueryResult.status} instead`,
        );
      }

      if (useQueryResult.error.status === 404) {
        // can safely access `body.message` because we excluded non-response Errors and undefined responses
        return expect(useQueryResult.error.body.message).toEqual('not found');
      }

      return exhaustiveGuard(useQueryResult.error);
    }

    // can safely access `data.body` because we excluded isPending and isError
    noop(useQueryResult.data.body.title);
  });

  it('useInfiniteQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const PAGE_SIZE = 10;

    const { result } = renderHook(
      () => {
        return tsr.posts.getPosts.useInfiniteQuery({
          queryKey: ['posts'],
          queryData: ({ pageParam }) => ({
            query: {
              skip: pageParam.skip,
              take: pageParam.take,
            },
          }),
          initialPageParam: { skip: 0, take: PAGE_SIZE },
          getNextPageParam: (lastPage, allPages) => {
            if (lastPage.status !== 200) return undefined;

            return lastPage.body.posts.length >= PAGE_SIZE
              ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
              : undefined;
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);
    expect(result.current.isPending).toStrictEqual(true);
    expect(result.current.contractEndpoint).toEqual(contract.posts.getPosts);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts?skip=0&take=10',
      body: undefined,
      rawQuery: {
        skip: 0,
        take: 10,
      },
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPosts,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual({
      pageParams: [{ skip: 0, take: PAGE_SIZE }],
      pages: [SUCCESS_RESPONSE],
    });
  });

  it('prefetchInfiniteQuery should set data for useInfiniteQuery', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const PAGE_SIZE = 10;

    const { result: prefetchResult } = renderHook(
      () => {
        const tsrQueryClient = tsr.useQueryClient();
        return tsrQueryClient.posts.getPosts.prefetchInfiniteQuery({
          queryKey: ['posts'],
          queryData: {
            query: {
              skip: 0,
              take: PAGE_SIZE,
            },
          },
          initialPageParam: { skip: 0, take: PAGE_SIZE },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await prefetchResult.current;

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts?skip=0&take=10',
      body: undefined,
      rawQuery: {
        skip: 0,
        take: 10,
      },
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPosts,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    const { result } = renderHook(
      () => {
        return tsr.posts.getPosts.useInfiniteQuery({
          queryKey: ['posts'],
          queryData: ({ pageParam }) => ({
            query: {
              skip: pageParam.skip,
              take: pageParam.take,
            },
          }),
          initialPageParam: { skip: 0, take: PAGE_SIZE },
          getNextPageParam: (lastPage, allPages) => {
            if (lastPage.status !== 200) return undefined;

            return lastPage.body.posts.length >= PAGE_SIZE
              ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
              : undefined;
          },
          staleTime: 10000,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    // `useInfiniteQuery` should not trigger a new fetch
    expect(api).toHaveBeenCalledTimes(1);

    expect(result.current.data).toStrictEqual({
      pageParams: [{ skip: 0, take: PAGE_SIZE }],
      pages: [SUCCESS_RESPONSE],
    });
  });

  it('useSuspenseQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.health.useSuspenseQuery({
          queryKey: ['health'],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitForElementToBeRemoved(await screen.findByText('loading'));

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
    expect(result.current.contractEndpoint).toEqual(contract.health);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('useQuery with select should handle success', async () => {
    api.mockResolvedValue({ status: 200, body: { message: 'hello world' } });

    const { result } = renderHook(
      () => {
        return tsr.health.useQuery({
          queryKey: ['health'],
          select: (data) => data.body.message,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual('hello world');
  });

  it('useQuery should accept extra headers', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
            headers: {
              'x-test': 'test',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('useQuery should override base headers', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
            headers: {
              'x-test': 'foo',
            },
            extraHeaders: {
              'content-type': 'application/xml',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'content-type': 'application/xml',
        'x-test': 'foo',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('useQuery should remove header if value is undefined', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
            extraHeaders: {
              'content-type': undefined,
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('useQuery should accept non-json string response', () => {
    api.mockResolvedValue({
      status: 200,
      body: 'Hello World',
    });

    const { result } = renderHook(
      () => {
        return tsr.health.useQuery({
          queryKey: ['health'],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    return waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
      expect(result.current.data).toStrictEqual({
        status: 200,
        body: 'Hello World',
      });
    });
  });

  it('useQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.health.useQuery({
          queryKey: ['health'],
          retry: false,
        });
      },
      { wrapper: ReactQueryProvider },
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    await waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.error).toStrictEqual(ERROR_RESPONSE);
  });

  it('useSuspenseQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.health.useSuspenseQuery({
          queryKey: ['health'],
          retry: false,
        });
      },
      { wrapper: ReactQueryProvider },
    );

    expect(
      await screen.findByText('Internal Server Error'),
    ).toBeInTheDocument();

    expect(result.current).toStrictEqual(null);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/health',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.health,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('useSuspenseQuery should not allow skipToken', async () => {
    renderHook(
      () => {
        return tsr.health.useSuspenseQuery({
          queryKey: ['health'],
          // @ts-expect-error - skipToken is not allowed in suspense
          queryData: skipToken,
        });
      },
      { wrapper: ReactQueryProvider },
    );
  });

  it('should handle mutation', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.createPost.useMutation();
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.contractEndpoint).toEqual(contract.posts.createPost);

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isPending).toStrictEqual(false);

    expect(result.current.error).toStrictEqual(null);

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
      route: contract.posts.createPost,
      signal: undefined,
      fetchOptions: {},
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeUndefined();
    });

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQueries should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                params: {
                  id: '1',
                },
              },
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                params: {
                  id: '2',
                },
              },
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);
    expect(result.current[0].isPending).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);
    expect(result.current[1].isPending).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    await waitFor(() => {
      expect(result.current[0].isPending).toStrictEqual(false);
      expect(result.current[1].isPending).toStrictEqual(false);
    });

    expect(result.current[0].data).toStrictEqual(SUCCESS_RESPONSE);

    expect(result.current[1].data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQueries should handle skipToken', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                params: {
                  id: '1',
                },
              },
            },
            {
              queryKey: ['posts', '2'],
              queryData: skipToken,
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);
    expect(result.current[0].isPending).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);
    expect(result.current[1].isPending).toStrictEqual(true);

    await waitFor(() => {
      expect(result.current[0].isPending).toStrictEqual(false);
      expect(result.current[1].isPending).toStrictEqual(true);
    });

    expect(result.current[0].data).toStrictEqual(SUCCESS_RESPONSE);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(api).toHaveBeenCalledTimes(1);
  });

  it('useQueries should handle `select`', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPosts.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                query: { take: 10 },
              },
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                query: { skip: 10, take: 10 },
              },
              select: (data) => {
                return data.body.posts.length;
              },
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current[0].data).toStrictEqual(undefined);
    expect(result.current[0].isPending).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);
    expect(result.current[1].isPending).toStrictEqual(true);

    await waitFor(() => {
      expect(result.current[0].isPending).toStrictEqual(false);
      expect(result.current[1].isPending).toStrictEqual(false);
    });

    expect(result.current[0].data?.body.posts).toStrictEqual(
      SUCCESS_RESPONSE.body.posts,
    );

    expect(result.current[1].data?.toFixed(5)).toStrictEqual('0.00000');
  });

  it('useQueries should handle `combine`', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPosts.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                query: { take: 10 },
              },
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                query: { skip: 10, take: 10 },
              },
            },
          ],
          combine: (results) => {
            return {
              data: results.map((result) => result.data),
              pending: results.some((result) => result.isPending),
            };
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current.data).toHaveLength(2);
    expect(result.current.pending).toStrictEqual(true);

    await waitFor(() => {
      expect(result.current.pending).toStrictEqual(false);
    });

    expect(result.current.data).toEqual([SUCCESS_RESPONSE, SUCCESS_RESPONSE]);
  });

  it('useSuspenseQueries should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useSuspenseQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                params: {
                  id: '1',
                },
              },
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                params: {
                  id: '2',
                },
              },
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitForElementToBeRemoved(await screen.findByText('loading'));

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(result.current[0].data).toStrictEqual(SUCCESS_RESPONSE);

    expect(result.current[1].data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQueries should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                params: {
                  id: '1',
                },
              },
              retry: false,
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                params: {
                  id: '2',
                },
              },
              retry: false,
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
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
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
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

  it('useQueries should handle success and failure', async () => {
    api
      .mockResolvedValueOnce(SUCCESS_RESPONSE)
      .mockResolvedValueOnce(ERROR_RESPONSE);

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQueries({
          queries: [
            {
              queryKey: ['posts', '1'],
              queryData: {
                params: {
                  id: '1',
                },
              },
              retry: false,
            },
            {
              queryKey: ['posts', '2'],
              queryData: {
                params: {
                  id: '2',
                },
              },
              retry: false,
            },
          ],
        });
      },
      {
        wrapper: ReactQueryProvider,
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
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/2',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
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

  it('fetchQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.posts.getPost.fetchQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('fetchQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      async () => {
        try {
          const queryClient = tsr.useQueryClient();
          return await queryClient.posts.getPost.fetchQuery({
            queryKey: ['post', '1'],
            queryData: {
              params: {
                id: '1',
              },
            },
          });
        } catch (error) {
          return error;
        }
      },
      {
        wrapper: ReactQueryProvider,
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
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('prefetchQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.posts.getPost.prefetchQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('getQueryData should return already fetched data', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    const { result } = renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.posts.getPost.getQueryData(['post', '1']);
      },
      {
        wrapper: ReactQueryProvider,
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
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('setQueryData should overwrite data returned from api', async () => {
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

    renderHook(
      () => {
        tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
          staleTime: 10000,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.posts.getPost.setQueryData(['post', '1'], data);
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    const { result } = renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
          staleTime: 10000,
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    return waitFor(() => {
      expect(result.current.isPending).toStrictEqual(false);
      expect(result.current.data).toStrictEqual(data);
    });
  });

  it('removeQueries should remove fetched data', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.removeQueries({ queryKey: ['post', '1'] });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    const { result } = renderHook(
      () => {
        const queryClient = tsr.useQueryClient();
        return queryClient.posts.getPost.getQueryData(['post', '1']);
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    expect(result.current).toStrictEqual(undefined);

    expect(api).toHaveBeenCalledTimes(1);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'https://api.com/posts/1',
      body: undefined,
      headers: {
        'x-test': 'test',
      },
      route: contract.posts.getPost,
      signal: expect.any(AbortSignal),
      fetchOptions: {
        signal: expect.any(AbortSignal),
      },
    });
  });

  it('refetchQueries should trigger query again', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    renderHook(
      () => {
        return tsr.posts.getPost.useQuery({
          queryKey: ['post', '1'],
          queryData: {
            params: {
              id: '1',
            },
          },
        });
      },
      {
        wrapper: ReactQueryProvider,
      },
    );

    await waitFor(() => expect(api).toHaveBeenCalledTimes(1));

    await act(async () => {
      renderHook(
        () => {
          const queryClient = tsr.useQueryClient();
          return queryClient.refetchQueries({ queryKey: ['post', '1'] });
        },
        {
          wrapper: ReactQueryProvider,
        },
      );
    });

    expect(api).toHaveBeenCalledTimes(2);
  });

  it('useTsrQueryClient should throw if not using provider', async () => {
    renderHook(
      () => {
        return tsr.useQueryClient();
      },
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            <ErrorBoundary
              fallbackRender={(error) => <p>{error.error?.message}</p>}
            >
              {children}
            </ErrorBoundary>
          </QueryClientProvider>
        ),
      },
    );

    expect(document.body).toContainHTML(
      'tsrQueryClient not initialized. Use TsRestReactQueryProvider to initialize one.',
    );
  });
});
