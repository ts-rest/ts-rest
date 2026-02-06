import { Controller, Get, Query } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { PostService } from './post.service';

const c = apiBlog;

// Modern ts-rest syntax using TsRestHandler decorator and tsRestHandler function
@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/test')
  test(@Query() queryParams: any) {
    return { queryParams };
  }

  @TsRestHandler(c.getPosts)
  async getPosts() {
    return tsRestHandler(
      c.getPosts,
      async ({ query: { take, skip, search }, headers }) => {
        const pagination = headers['x-pagination'];
        const { posts, totalPosts } = await this.postService.getPosts({
          take,
          skip,
          search,
        });

        return {
          status: 200 as const,
          body: { posts, count: totalPosts, skip, take, pagination },
        };
      },
    );
  }

  @TsRestHandler(c.getPost)
  async getPost() {
    return tsRestHandler(c.getPost, async ({ params: { id } }) => {
      const post = await this.postService.getPost(id);

      if (!post) {
        return { status: 404 as const, body: null };
      }

      return { status: 200 as const, body: post };
    });
  }

  @TsRestHandler(c.createPost)
  async createPost() {
    return tsRestHandler(c.createPost, async ({ body }) => {
      const post = await this.postService.createPost({
        title: body.title,
        content: body.content,
        published: body.published,
        description: body.description,
      });

      return { status: 201 as const, body: post };
    });
  }

  @TsRestHandler(c.updatePost)
  async updatePost() {
    return tsRestHandler(c.updatePost, async ({ params: { id }, body }) => {
      const post = await this.postService.updatePost(id, {
        title: body.title,
        content: body.content,
        published: body.published,
        description: body.description,
      });

      return { status: 200 as const, body: post };
    });
  }

  @TsRestHandler(c.deletePost)
  async deletePost() {
    return tsRestHandler(c.deletePost, async ({ params: { id } }) => {
      await this.postService.deletePost(id);

      return { status: 200 as const, body: { message: 'Post Deleted' } };
    });
  }

  @TsRestHandler(c.testPathParams)
  async testPathParams() {
    return tsRestHandler(c.testPathParams, async ({ params }) => {
      return { status: 200 as const, body: params };
    });
  }
}
