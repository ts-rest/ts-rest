import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  nestControllerContract,
  TsRestHandlerImpl,
  TsRestHandlerArgs,
  TsRestHandler,
} from '@ts-rest/nest';
import { PostService } from './post.service';

const c = nestControllerContract(apiBlog);

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @TsRestHandler(c)
  handler(@TsRestHandlerArgs(c) impl: TsRestHandlerImpl<typeof c>) {
    return impl({
      getPosts: async ({ query: { take, skip, search }, headers }) => {
        const { posts, totalPosts } = await this.postService.getPosts({
          take,
          skip,
          search,
        });

        return {
          status: 200,
          body: {
            pagination: headers['x-pagination'],
            posts,
            count: totalPosts,
            skip,
            take,
          },
        };
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
      updatePost: async ({ params: { id }, body }) => {
        const post = await this.postService.updatePost(id, {
          title: body.title,
          content: body.content,
          published: body.published,
          description: body.description,
        });

        return { status: 200, body: post };
      },
      deletePost: async ({ params: { id } }) => {
        await this.postService.deletePost(id);

        return { status: 200, body: { message: 'Success' } };
      },
      getPost: async ({ params: { id } }) => {
        const post = await this.postService.getPost(id);

        if (!post) {
          return { status: 404, body: null };
        }

        return { status: 200, body: post };
      },
      testPathParams: async ({ params }) => {
        return { status: 200, body: params };
      },
    });
  }
}
