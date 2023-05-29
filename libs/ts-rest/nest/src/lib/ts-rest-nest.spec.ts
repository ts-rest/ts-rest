import { initContract } from '@ts-rest/core';
import {
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
} from './ts-rest-nest';
import { TsRest } from './ts-rest.decorator';
import { TsRestRequest } from './ts-rest-request.decorator';

const c = initContract();
const postsRouter = c.router({
  getPost: {
    method: 'GET',
    path: `/posts/:id`,
    responses: {
      200: null,
    },
  },
});

it('allows unknown statuses when not in strict mode', () => {
  const cLoose = c.router({ posts: postsRouter });
  const nestContract = nestControllerContract(cLoose.posts);
  type RequestShapes = NestRequestShapes<typeof nestContract>;

  class PostController implements NestControllerInterface<typeof nestContract> {
    @TsRest(nestContract.getPost)
    async getPost(
      @TsRestRequest() { params: { id } }: RequestShapes['getPost']
    ) {
      return { status: 201 as const, body: null };
    }
  }
});

it('does not allow unknown statuses when in strict mode', () => {
  const cStrict = c.router({ posts: postsRouter }, { strict: true });
  const nestContract = nestControllerContract(cStrict.posts);
  type RequestShapes = NestRequestShapes<typeof nestContract>;

  class PostController implements NestControllerInterface<typeof nestContract> {
    @TsRest(nestContract.getPost)
    // @ts-expect-error 201 is not defined as a known response
    async getPost(
      @TsRestRequest() { params: { id } }: RequestShapes['getPost']
    ) {
      return { status: 201 as const, body: null };
    }
  }
});
