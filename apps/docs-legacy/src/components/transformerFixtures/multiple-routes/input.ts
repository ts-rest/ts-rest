import { Controller, Get, Query } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import {
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
  TsRest,
  TsRestRequest,
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

  @TsRest(c.getPosts)
  async getPosts(
    @TsRestRequest()
    {
      query: { take, skip, search },
      headers: { 'x-pagination': pagination },
    }: RequestShapes['getPosts']
  ) {
    const { posts, totalPosts } = await this.postService.getPosts({
      take,
      skip,
      search,
    });

    return {
      status: 200 as const,
      body: { posts, count: totalPosts, skip, take, pagination },
    };
  }

  @TsRest(c.getPost)
  async getPost(@TsRestRequest() { params: { id } }: RequestShapes['getPost']) {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }

  @TsRest(c.createPost)
  async createPost(@TsRestRequest() { body }: RequestShapes['createPost']) {
    const post = await this.postService.createPost({
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 201 as const, body: post };
  }
}
