import { initTsCont } from '@tscont/tscont';

const c = initTsCont();

export type Post = {
  id: number;
  title: string;
  body: string;
};

export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post>(),
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
  }),
});
