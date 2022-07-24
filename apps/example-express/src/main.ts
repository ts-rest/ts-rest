/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import * as express from 'express';
import cors = require('cors');
import { router } from '@tscont/example-contracts';

const app = express();

app.use(cors());

app.get('/api', (req, res) => {
  res.send({ message: 'Welcome to example-express!' });
});

app.get('/posts', (req, res) => {
  const response: typeof router.posts.getPosts.response = [
    { id: 1, title: 'Hello world', body: 'This is a test' },
    { id: 2, title: 'Special Post', body: 'Another post' },
  ];

  res.send(response);
});

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
