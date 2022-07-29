import * as express from 'express';
import cors = require('cors');
import { router } from '@tscont/example-contracts';
import { createExpressEndpoints, initServer } from '@ts-rest/core';
import { PrismaClient } from '@prisma/client';
import * as bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const s = initServer();

const prisma = new PrismaClient();

const postsRouter = s.router(router.posts, {
  getPost: async ({ params: { id } }) => {
    const post = prisma.post.findUnique({ where: { id } });

    return post ?? null;
  },
  getPosts: async ({ query: { take, skip } }) => {
    const posts = await prisma.post.findMany({
      take: Number(take),
      skip: Number(skip),
    });

    return posts;
  },
  createPost: async ({
    body: { title, content, published, authorId, description },
  }) => {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        authorId,
        description,
      },
    });

    return post;
  },
  updatePost: async ({
    params: { id },
    body: { title, content, published, description },
  }) => {
    const post = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        published,
        description,
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
