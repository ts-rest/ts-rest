import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { initContract } from '@ts-rest/core';
import { initQueryClient } from '@ts-rest/react-query';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { z } from 'zod';

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

const postsRouter = c.router({
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
});

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
  baseUrl: 'http://api.com',
  baseHeaders: {},
  api,
});

let queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

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

    const { result } = renderHook(() => client.health.useQuery(['health']), {
      wrapper,
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/health',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQuery should accept non-json string response', () => {
    api.mockResolvedValue({
      status: 200,
      body: 'Hello World',
    });

    const { result } = renderHook(() => client.health.useQuery(['health']), {
      wrapper,
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/health',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return waitFor(() => {
      expect(result.current.isLoading).toStrictEqual(false);
      expect(result.current.data).toStrictEqual({
        status: 200,
        body: 'Hello World',
      });
    });
  });

  it('useQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () => client.health.useQuery(['health'], {}, { retry: () => false }),
      { wrapper }
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/health',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.error).toStrictEqual(ERROR_RESPONSE);
  });

  it('should handle mutation', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(() => client.posts.createPost.useMutation(), {
      wrapper,
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(false);

    expect(result.current.error).toStrictEqual(null);

    await act(() =>
      result.current.mutateAsync({
        body: {
          description: 'test',
          title: 'test',
          content: '',
          authorId: '1',
        },
      })
    );

    expect(api).toHaveBeenCalledWith({
      method: 'POST',
      path: 'http://api.com/posts',
      body: JSON.stringify({
        description: 'test',
        title: 'test',
        content: '',
        authorId: '1',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    await waitFor(() => {
      expect(result.current.data).not.toBeUndefined();
    });

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQueries should handle success', async () => {
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
      }
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/1',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/2',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
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

  it('useQueries should handle failure', async () => {
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
      }
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/1',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/2',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
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
      }
    );

    expect(result.current[0].data).toStrictEqual(undefined);

    expect(result.current[0].isLoading).toStrictEqual(true);

    expect(result.current[1].data).toStrictEqual(undefined);

    expect(result.current[1].isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/1',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/posts/2',
      body: undefined,
      headers: {
        'Content-Type': 'application/json',
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
});
