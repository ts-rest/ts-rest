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
    path: '/posts-json-query',
    query: z.object({
      take: z.number().default(50),
      skip: z.number().default(0),
      search: z.string().optional(),
    }),
  },
});
type RequestShapes = NestRequestShapes<typeof c>;

@TsRest({ jsonQuery: true })
@Controller()
export class PostJsonQueryController
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
