import { Controller } from '@nestjs/common';
import { apiBlog } from '@ts-rest/example-contracts';
import { Api, ApiDecorator, initNestServer } from '@ts-rest/nest';
import { PostService } from './post.service';

const s = initNestServer(apiBlog);
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;

@Controller()
export class PostController implements ControllerShape {
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

  @Api(s.route.getPost)
  async getPost(@ApiDecorator() { params: { id } }: RouteShape['getPost']) {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }


  @Api(s.route.createPost)
  async createPost(@ApiDecorator() { body }: RouteShape['createPost']) {
    const post = await this.postService.createPost({
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 201 as const, body: post };
  }

  @Api(s.route.updatePost)
  async updatePost(
    @ApiDecorator() { params: { id }, body }: RouteShape['updatePost']
  ) {
    const post = await this.postService.updatePost(id, {
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return { status: 200 as const, body: post };
  }

  @Api(s.route.deletePost)
  async deletePost(
    @ApiDecorator() { params: { id } }: RouteShape['deletePost']
  ) {
    await this.postService.deletePost(id);

    return { status: 200 as const, body: { message: 'Post Deleted' } };
  }
}
