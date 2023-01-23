import { Controller, Get, Query } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  Api,
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
  TypedRequest,
} from '@ts-rest/nest';
import { PostService } from './post.service';

const c = nestControllerContract(apiBlog);
type RequestShapes = NestRequestShapes<typeof c>;

// You can implement the NestControllerInterface interface to ensure type safety
@Controller()
export class PostController implements NestControllerInterface<typeof c> {
  constructor(private readonly postService: PostService) {}

  @Get('/test')
  test(@Query() queryParams: any) {
    return { queryParams };
  }

  @Api(c.getPosts)
  async getPosts(
    @TypedRequest() { query: { take, skip, search } }: RequestShapes['getPosts']
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

  @Api(c.getPost)
  async getPost(@TypedRequest() { params: { id } }: RequestShapes['getPost']) {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }

  @Api(c.createPost)
  async createPost(@TypedRequest() { body }: RequestShapes['createPost']) {
    const post = await this.postService.createPost({
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 201 as const, body: post };
  }

  @Api(c.updatePost)
  async updatePost(
    @TypedRequest() { params: { id }, body }: RequestShapes['updatePost']
  ) {
    const post = await this.postService.updatePost(id, {
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 200 as const, body: post };
  }

  @Api(c.deletePost)
  async deletePost(
    @TypedRequest() { params: { id } }: RequestShapes['deletePost']
  ) {
    await this.postService.deletePost(id);

    return { status: 200 as const, body: { message: 'Post Deleted' } };
  }

  @Api(c.testPathParams)
  async testPathParams(
    @TypedRequest() { params }: RequestShapes['testPathParams']
  ) {
    return { status: 200 as const, body: params };
  }
}
