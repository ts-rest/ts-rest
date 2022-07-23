import { initTsCont } from './dsl';

type User = {
  id: string;
  name: string;
};

type Post = {
  id: string;
  title: string;
  content: string;
};

const c = initTsCont();

const router = c.router({
  user: c.router({
    getUser: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/users/${id}`,
      response: c.response<User>(),
    }),
    getUsers: c.query({
      method: 'GET',
      path: () => '/users',
      response: c.response<User[]>(),
    }),
  }),
  post: c.router({
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
    getPost: c.query({
      method: 'GET',
      path: ({ id }) => `/posts/${id}`,
      response: c.response<Post>(),
    }),
  }),
});

export type Schema = typeof router;
