import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { router } from '@tscont/example-contracts';
import { initNestServer } from '@ts-rest/core';
import { PostService } from './post.service';

const s = initNestServer(router.posts);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly postService: PostService) {}

  @Get(s.paths.getPosts)
  async getPosts(@Query() { take, skip }: { take?: string; skip?: string }) {
    const posts = await this.postService.getPosts({
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });

    return posts;
  }

  @Get(s.paths.getPost)
  async getPost(@Param() { id }: { id: string }) {
    const post = await this.postService.getPost(id);

    return post;
  }

  @Post(s.paths.createPost)
  async createPost(@Body() rawBody: unknown) {
    const body = router.posts.createPost.body.parse(rawBody);

    const post = await this.postService.createPost({
      title: body.title,
      content: body.content,
      published: body.published,
      authorId: body.authorId,
      description: body.description,
    });

    return post;
  }

  @Put(s.paths.updatePost)
  async updatePost(@Param() { id }: { id: string }, @Body() rawBody: unknown) {
    const body = router.posts.updatePost.body.parse(rawBody);

    const post = await this.postService.updatePost(id, {
      title: body.title,
      content: body.content,
      published: body.published,
      description: body.description,
    });

    return post;
  }

  @Delete(s.paths.deletePost)
  async deletePost(@Param() { id }: { id: string }) {
    await this.postService.deletePost(id);

    return true;
  }
}
