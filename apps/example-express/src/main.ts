import * as express from 'express';
import cors = require('cors');
import { router } from '@tscont/example-contracts';
import { createExpressEndpoints, initServer } from '@tscont/ts-rest-core';
import { PrismaClient } from '@prisma/client';

const app = express();

app.use(cors());

const s = initServer();

const prisma = new PrismaClient();

const postsRouter = s.router(router.posts, {
  getPost: async ({ params: { id } }) => {
    const post = prisma.post.findUnique({ where: { id } });

    return post ?? null;
  },
  getPosts: async () => {
    const posts = await prisma.post.findMany();

    return posts;
  },
  createPost: async ({ body: { title, content, published } }) => {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId: '',
      },
    });

    return post;
  },
  deletePost: async ({ params: { id } }) => {
    const result = await prisma.post
      .delete({ where: { id } })
      .then(() => true)
      .catch(() => false);

    return result;
  },
});

const completeRouter = s.router(router, {
  posts: postsRouter,
  health: async () => {
    return {
      message: 'OK',
    };
  },
});

createExpressEndpoints(router, completeRouter, app);

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
