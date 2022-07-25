import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { router } from '@tscont/example-contracts';
import { initNestServer } from '@tscont/ts-rest-core';

const s = initNestServer(router.posts);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly appService: AppService) {}

  @Get(s.paths.getPosts)
  async getPosts() {
    const posts = this.appService.findAll();

    return posts;
  }

  @Get(s.paths.getPost)
  async getPost(@Param() { id }: { id: string }) {
    const post = this.appService.findOne(id);

    return post ?? null;
  }

  @Get(s.paths.getPostComments)
  async getPostComments(@Param() { id }: { id: string }) {
    const comments = this.appService.findPostComments(id);

    return comments;
  }

  @Get(s.paths.getPostComment)
  async getPostComment(
    @Param() { id, commentId }: { id: string; commentId: string }
  ) {
    const allComments = this.appService.findPostComments(id);

    const comment = allComments.find((c) => c.id === commentId);

    return comment ?? null;
  }

  @Post(s.paths.createPost)
  async createPost() {
    return { id: '1', title: 'title', body: 'body' };
  }

  @Delete(s.paths.deletePost)
  async deletePost(@Param() { id }: { id: string }) {
    console.log('deleting post ', id);
  }
}
