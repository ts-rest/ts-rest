import * as express from 'express';
import cors = require('cors');
import { router } from '@tscont/example-contracts';
import { createExpressEndpoints, initServer } from 'tscont';
import { database } from './database';

const app = express();

app.use(cors());

const s = initServer();

const postsRouter = s.router(router.posts, {
  getPost: ({ id }) => {
    const post = database.findOne(id);

    return post ?? null;
  },
  getPosts: () => {
    const posts = database.findAll();

    return posts;
  },
  getPostComments: ({ id }) => {
    const comments = database.findPostComments(id);

    return comments;
  },
});

const completeRouter = s.router(router, {
  posts: postsRouter,
  health: () => {
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
