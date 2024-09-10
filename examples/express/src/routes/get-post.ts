import { apiBlog } from '@ts-rest-examples/contracts';
import { initServer } from '@ts-rest/express';
import { mockPostFixtureFactory } from '../lib/fixtures';

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
