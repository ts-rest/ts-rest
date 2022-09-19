/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import * as cors from 'cors';

import { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
import { userAdapter } from './app/userAdapter';

const s = initServer();

const postsRouter = s.router(postsApi, {
  getPosts: async () => {
    const author = await userAdapter.getUser('1');

    if (!author) {
      return {
        status: 400,
        body: {
          message: 'Author not found for post',
        },
      };
    }

    return {
      status: 200,
      body: [
        {
          id: '123',
          title: 'Hello World',
          description: 'This is a description',
          content: 'This is the content',
          published: true,
          tags: [],
          author: {
            id: author.id,
            name: author.name,
            email: author.email,
          },
        },
      ],
    };
  },
});

const app = express();

app.use(cors());

createExpressEndpoints(postsApi, postsRouter, app);

const port = process.env.port || 5003;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
server.on('error', console.error);
