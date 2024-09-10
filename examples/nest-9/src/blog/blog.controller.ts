import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest-examples/contracts';
import {
  type NestControllerInterface,
  type NestRequestShapes,
  TsRest,
  TsRestRequest,
  nestControllerContract,
} from '@ts-rest/nest';
import { BlogService } from './blog.service';

const c = nestControllerContract(apiBlog);
type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
export class BlogController implements NestControllerInterface<typeof c> {
  constructor(protected readonly postService: BlogService) {}

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
      body: {
        posts,
        count: totalPosts,
        skip,
        take,
        pagination,
      },
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

  @TsRest(c.updatePost)
  async updatePost(
    @TsRestRequest() { params: { id }, body }: RequestShapes['updatePost']
  ) {
    const post = await this.postService.updatePost(id, {
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 200 as const, body: post };
  }

  @TsRest(c.deletePost)
  async deletePost(
    @TsRestRequest() { params: { id } }: RequestShapes['deletePost']
  ) {
    if (id === 'all') {
      await this.postService.deleteAllPosts();
    } else {
      await this.postService.deletePost(id);
    }

    return { status: 200 as const, body: { message: 'Post Deleted' } };
  }

  @TsRest(c.testPathParams)
  async testPathParams(
    @TsRestRequest() { params }: RequestShapes['testPathParams']
  ) {
    return { status: 200 as const, body: params };
  }
}
