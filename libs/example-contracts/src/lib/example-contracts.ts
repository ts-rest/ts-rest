import { initTsCont } from 'tscont';
import { z } from 'zod';

const c = initTsCont();

export type Post = {
  id: string;
  title: string;
  body: string;
};

export type Comment = {
  id: string;
  postId: string;
  body: string;
};

// Three endpoints, two for posts, and one for health
export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post | null>(),
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
    getPostComments: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}/comments`,
      response: c.response<Comment[]>(),
    }),
    getPostComment: c.query({
      method: 'GET',
      path: ({ id, commentId }: { id: string; commentId: string }) =>
        `/posts/${id}/comments/${commentId}`,
      response: c.response<Comment | null>(),
    }),
    createPost: c.mutation({
      method: 'POST',
      path: () => '/posts',
      response: c.response<Post>(),
      body: z.object({
        title: z.string(),
        body: z.string(),
      }),
    }),
    deletePost: c.mutation({
      method: 'DELETE',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<void>(),
    }),
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
  }),
});
