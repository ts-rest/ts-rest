import { Controller, Get, Query } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { PostService } from './post.service';
// You can implement the NestControllerInterface interface to ensure type safety
@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}
  @Get('/test')
  test(
    @Query()
    queryParams: any
  ) {
    return { queryParams };
  }
  @TsRestHandler(apiBlog)
  handler() {
    return tsRestHandler(apiBlog, {
      getPosts: async ({
        query: { take, skip, search },
        headers: { 'x-pagination': pagination },
      }) => {
        const { posts, totalPosts } = await this.postService.getPosts({
          take,
          skip,
          search,
        });
        return {
          status: 200,
          body: { posts, count: totalPosts, skip, take, pagination },
        };
      },
      getPost: async ({ params: { id } }) => {
        const post = await this.postService.getPost(id);
        if (!post) {
          return { status: 404, body: null };
        }
        return { status: 200, body: post };
      },
      createPost: async ({ body }) => {
        const post = await this.postService.createPost({
          title: body.title,
          content: body.content,
          published: body.published,
          description: body.description,
        });
        return { status: 201, body: post };
      },
    });
  }
}
