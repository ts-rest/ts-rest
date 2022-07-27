import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  async getPosts() {
    const posts = await this.prisma.post.findMany({});

    return posts;
  }

  async getPost(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });

    return post ?? null;
  }

  async createPost(params: {
    title: string;
    content: string;
    published: boolean | undefined;
    authorId: string;
    description: string | undefined;
  }) {
    const post = await this.prisma.post.create({
      data: {
        ...params,
      },
    });

    return post;
  }

  async updatePost(
    id: string,
    params: {
      title: string | undefined;
      content: string | undefined;
      published: boolean | undefined;
      description: string | undefined;
    }
  ) {
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...params,
      },
    });

    return post;
  }

  async deletePost(id: string) {
    await this.prisma.post.delete({ where: { id } });

    return true;
  }
}
