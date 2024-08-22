import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class BlogService {
  constructor(protected readonly prisma: PrismaService) {}

  async getPosts({
    take,
    skip,
    search,
  }: {
    take?: number;
    skip?: number;
    search?: string;
  }) {
    const posts = await this.prisma.post.findMany({
      take,
      skip,
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: { contains: search },
                },
                {
                  content: { contains: search },
                },
                {
                  description: { contains: search },
                },
              ],
            }
          : {}),
      },
    });

    const totalPosts = await this.prisma.post.count({
      take,
      skip,
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: { contains: search },
                },
                {
                  content: { contains: search },
                },
                {
                  description: { contains: search },
                },
              ],
            }
          : {}),
      },
    });

    return { posts, totalPosts };
  }

  async getPost(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
    });
  }

  async createPost(params: {
    title: string;
    content: string;
    published: boolean | undefined;
    description: string | undefined;
  }) {
    return this.prisma.post.create({
      data: {
        ...params,
      },
    });
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
    return this.prisma.post.update({
      where: { id },
      data: {
        ...params,
      },
    });
  }

  async deletePost(id: string) {
    await this.prisma.post.delete({ where: { id } });

    return true;
  }

  async deleteAllPosts() {
    await this.prisma.post.deleteMany();

    return true;
  }
}
