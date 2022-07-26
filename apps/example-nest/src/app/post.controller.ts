import { Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { router } from '@tscont/example-contracts';
import { initNestServer } from '@ts-rest/core';
import { PrismaService } from './prisma.service';

const s = initNestServer(router.posts);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly prisma: PrismaService) {}

  @Get(s.paths.getPosts)
  async getPosts() {
    const posts = await this.prisma.post.findMany({});

    return posts;
  }

  @Get(s.paths.getPost)
  async getPost(@Param() { id }: { id: string }) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    return post ?? null;
  }

  @Post(s.paths.createPost)
  async createPost() {
    const post = await this.prisma.post.create({
      data: {
        title: 'Hello World',
        content: 'This is a test post',
        published: true,
        authorId: '1',
      },
    });

    return post;
  }

  @Put(s.paths.updatePost)
  async updatePost() {
    const post = await this.prisma.post.update({
      where: { id: '1' },
      data: {
        title: 'Hello World',
        content: 'This is a test post',
        published: true,
        authorId: '1',
      },
    });

    return post;
  }

  @Delete(s.paths.deletePost)
  async deletePost(@Param() { id }: { id: string }) {
    console.log('deleting post ', id);

    return true;
  }
}
