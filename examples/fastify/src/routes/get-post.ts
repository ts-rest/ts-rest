import { apiBlog } from '@ts-rest-examples/contracts';
import { initServer } from '@ts-rest/fastify';
import { mockPost } from '../lib/mock-post';

const s = initServer();

export const getPost = s.route(apiBlog.getPost, async ({ params: { id } }) => {
  const post = mockPost({ id });

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
