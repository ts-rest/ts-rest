import { Controller, Get, Query } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  Api,
  nestControllerContract,
  NestRequestShapes,
  NestResponseShapes,
  TsRestRequest,
} from '@ts-rest/nest';
import { PostService } from './post.service';

const c = nestControllerContract(apiBlog);
type RequestShapes = NestRequestShapes<typeof c>;
type ResponseShapes = NestResponseShapes<typeof c>;

// Alternatively, you can the use the ResponseShapes type to ensure type safety
@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/test')
  test(@Query() queryParams: any) {
    return { queryParams };
  }

  @Api(c.getPosts)
  async getPosts(
    @TsRestRequest()
    { query: { take, skip, search } }: RequestShapes['getPosts']
  ): Promise<ResponseShapes['getPosts']> {
    const { posts, totalPosts } = await this.postService.getPosts({
      take,
      skip,
      search,
    });

    return {
      status: 200,
      body: { posts, count: totalPosts, skip, take },
    };
  }

  @Api(c.getPost)
  async getPost(
    @TsRestRequest() { params: { id } }: RequestShapes['getPost']
  ): Promise<ResponseShapes['getPost']> {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404, body: null };
    }

    return { status: 200, body: post };
  }

  @Api(c.createPost)
  async createPost(
    @TsRestRequest() { body }: RequestShapes['createPost']
  ): Promise<ResponseShapes['createPost']> {
    const post = await this.postService.createPost({
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 201, body: post };
  }

  @Api(c.updatePost)
  async updatePost(
    @TsRestRequest() { params: { id }, body }: RequestShapes['updatePost']
  ): Promise<ResponseShapes['updatePost']> {
    const post = await this.postService.updatePost(id, {
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 200, body: post };
  }

  @Api(c.deletePost)
  async deletePost(
    @TsRestRequest() { params: { id } }: RequestShapes['deletePost']
  ): Promise<ResponseShapes['deletePost']> {
    await this.postService.deletePost(id);

    return { status: 200, body: { message: 'Post Deleted' } };
  }

  @Api(c.testPathParams)
  async testPathParams(
    @TsRestRequest() { params }: RequestShapes['testPathParams']
  ): Promise<ResponseShapes['testPathParams']> {
    return { status: 200, body: params };
  }
}
