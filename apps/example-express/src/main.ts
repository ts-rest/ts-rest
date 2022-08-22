import * as express from 'express';
import cors = require('cors');
import { apiBlog } from '@ts-rest/example-contracts';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { PrismaClient } from '@prisma/client';
import * as bodyParser from 'body-parser';

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const s = initServer();

const prisma = new PrismaClient();

const completedRouter = s.router(apiBlog, {
  getPost: async ({ params: { id } }) => {
    const post = await prisma.post.findUnique({ where: { id } });

    if (!post) {
      return {
        status: 404,
        body: null,
      };
    }

    return {
      status: 200,
      body: post,
    };
  },
  getPosts: async ({ query }) => {
    const posts = await prisma.post.findMany({
      where: {
        ...(query.search ? { title: { contains: query.search } } : {}),
      },
    });

    return {
      status: 200,
      body: {
        posts,
        total: 0,
      },
    };
  },
  createPost: async ({ body }) => {
    const post = await prisma.post.create({
      data: body,
    });

    return {
      status: 201,
      body: post,
    };
  },
  updatePost: async ({ body, params }) => {
    const post = await prisma.post.update({
      where: {
        id: params.id,
      },
      data: body,
    });

    return {
      status: 200,
      body: post,
    };
  },
  deletePost: async ({ params }) => {
    await prisma.post.delete({
      where: {
        id: params.id,
      },
    });

    return {
      status: 200,
      body: { message: 'Post deleted' },
    };
  },
});

createExpressEndpoints(apiBlog, completedRouter, app);

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
