import { initTsCont } from 'tscont';

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
  }),
  health: c.query({
    method: 'GET',
    path: () => '/health',
    response: c.response<{ message: string }>(),
  }),
});
