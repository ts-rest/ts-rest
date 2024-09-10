import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest-examples/contracts';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { BlogService } from './blog.service';

@Controller()
export class BlogController {
  constructor(protected readonly postService: BlogService) {}

  @TsRestHandler(apiBlog)
  async handler() {
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
          status: 200 as const,
          body: {
            posts,
            count: totalPosts,
            skip,
            take,
            pagination,
          },
        };
      },
      getPost: async ({ params: { id } }) => {
        const post = await this.postService.getPost(id);

        if (!post) {
          return { status: 404 as const, body: null };
        }

        return { status: 200 as const, body: post };
      },
      createPost: async ({ body }) => {
        const post = await this.postService.createPost({
          title: body.title,
          content: body.content,
          published: body.published,
          description: body.description,
        });

        return { status: 201 as const, body: post };
      },
      updatePost: async ({ params: { id }, body }) => {
        const post = await this.postService.updatePost(id, {
          title: body.title,
          content: body.content,
          published: body.published,
          description: body.description,
        });

        return { status: 200 as const, body: post };
      },
      deletePost: async ({ params: { id } }) => {
        if (id === 'all') {
          await this.postService.deleteAllPosts();
        } else {
          await this.postService.deletePost(id);
        }

        return { status: 200 as const, body: { message: 'Post Deleted' } };
      },
      testPathParams: async ({ params }) => {
        return { status: 200 as const, body: params };
      },
    });
  }
}
