import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { router } from '@tscont/example-contracts';
import { initNestServer } from 'tscont';

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

    return post;
  }

  @Get(s.paths.getPostComments)
  async getPostComments(@Param() { id }: { id: string }) {
    const comments = this.appService.findPostComments(id);

    return comments;
  }
}
