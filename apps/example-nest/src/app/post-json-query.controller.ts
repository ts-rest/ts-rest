import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import { Api, ApiDecorator, initNestServer, JsonQuery } from '@ts-rest/nest';
import { z } from 'zod';
import { PostService } from './post.service';

const s = initNestServer({
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
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;

@JsonQuery()
@Controller()
export class PostJsonQueryController implements ControllerShape {
  constructor(private readonly postService: PostService) {}

  @Api(s.route.getPosts)
  async getPosts(
    @ApiDecorator() { query: { take, skip, search } }: RouteShape['getPosts']
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
