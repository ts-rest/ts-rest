import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const posts = {
  createPost: async (data: { title: string; content: string }) => {
    const newPost = await prisma.post.create({ data });

    return newPost;
  },
  getPost: async (id: string) => {
    const post = await prisma.post.findUnique({ where: { id } });

    return post || null;
  },
  getPosts: async () => {
    const posts = await prisma.post.findMany({});

    return posts;
  },
};
