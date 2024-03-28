import { initServer } from '@ts-rest/express';
import { mockPostFixtureFactory } from './fixtures';
import { apiBlog } from '@ts-rest/example-contracts';

const s = initServer();
export const getPost = s.route(apiBlog.getPost, async ({ params: { id } }) => {
  const post = mockPostFixtureFactory({ id });

  if (!post) {
    return {
      status: 404,
      body: null,
    };
  }

  return {
    status: 200,
    body: post,
  };
});
