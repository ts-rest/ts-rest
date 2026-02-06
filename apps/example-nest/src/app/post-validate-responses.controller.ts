import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { z } from 'zod';
import { PostService } from './post.service';

const c = {
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
};

@Controller()
export class PostValidateResponsesController {
  constructor(private readonly postService: PostService) {}

  @TsRestHandler(c.getPosts, {
    jsonQuery: true,
    validateResponses: true,
  })
  async getPosts() {
    return tsRestHandler(
      c.getPosts,
      async ({ query: { take, skip, search } }) => {
        const { posts, totalPosts } = await this.postService.getPosts({
          take,
          skip,
          search,
        });

        return {
          status: 200 as const,
          body: { posts, count: totalPosts, skip, take },
        };
      },
    );
  }
}
