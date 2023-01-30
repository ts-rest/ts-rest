import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  TsRestRequest,
  TsRest,
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
} from '@ts-rest/nest';
import { z } from 'zod';
import { PostService } from './post.service';

const c = nestControllerContract({
  getPosts: {
    ...apiBlog.getPosts,
    path: '/posts',
    query: z.object({
      take: z.number().default(50),
      skip: z.number().default(0),
      search: z.string().optional(),
    }),
    responses: {
      ...apiBlog.getPosts.responses,
      200: apiBlog.getPosts.responses['200'].extend({
        extra: z.string().default('hello world'),
      }),
    },
  },
});
type RequestShapes = NestRequestShapes<typeof c>;

@TsRest({ jsonQuery: true, validateResponses: true })
@Controller()
export class PostValidateResponsesController
  implements NestControllerInterface<typeof c>
{
  constructor(private readonly postService: PostService) {}

  @TsRest(c.getPosts)
  async getPosts(
    @TsRestRequest()
    { query: { take, skip, search } }: RequestShapes['getPosts']
  ) {
    const { posts, totalPosts } = await this.postService.getPosts({
      take,
      skip,
      search,
    });

    return {
      status: 200 as const,
      body: { posts, count: totalPosts, skip, take },
    };
  }
}
