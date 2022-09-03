import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const postsService = {
  createPost: async (data: { title: string; content: string }) => {
    const newPost = await prisma.post.create({ data });

    return newPost;
  },
  getPost: async (id: string) => {
    const post = await prisma.post.findUnique({ where: { id } });

    return post || null;
  },
  getPosts: async (args: { skip?: number; take?: number }) => {
    const posts = await prisma.post.findMany(args);
    const count = await prisma.post.count();

    return { posts, count };
  },
};
