# ts-rest

<p align="center">
 <img src="https://avatars.githubusercontent.com/u/109956939?s=400&u=8bf67b1281da46d64eab85f48255cd1892bf0885&v=4" height=150 />
</p>

## Motivation

ts-rest provides an RPC-like client side interface over your existing REST APIs, as well as allowing you define a _separate_ contract implementation rather than going for a 'implementation is the contract' approach, which is best suited for smaller or simpler APIs.

If you have non typescript consumers, a public API, or maybe want to add type safety to your existing REST API? ts-rest is what you're looking for!

## tRPC Comparison

I _love_ [tRPC](https://trpc.io/), [KATT (Alex Johansson)](https://github.com/KATT) and all the [other maintainers](https://github.com/trpc/trpc/graphs/contributors) have done some amazing work, and for applications with a single Next.js app, or an express server only consumed by TRPC clients, I whole heartily recommend using tRPC! Also I have undoubtedly taken inspiration from tRPC for ts-rest.

One of the biggest differences between tRPC and ts-rest is that tRPC defines your API implementation _as the contract_, for some use cases it is beneficial to have a separate contract to represent the API.

One example of this is with NX, in NX you can rebuild only "affected" packages, however, if you export your contract (e.g. tRPC) from the backend, your front end will need to be rebuilt as well. ts-rest negates this issue by allowing (in NX) for a library for the API contract to be created, this then means the only case in which the front and backend need to be rebuilt is when the contract changes.

## REST(ish) vs RPC

> REST(ish)? REST is a term the industry (as a whole) has used incorrectly for many years now. In recent years, it is used as a synonym for HTTP requests over a API. [Read more here](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/)

ts-rest allows you design an API as you would "normally", e.g. GET, POST, PUT, DELETE etc. to `/posts`, `/posts/:id`, `/posts/:id/comments` etc. whilst providing these endpoints to the client as RPC-type calls like `client.posts.getPost({ id: "1" })` or `client.posts.getPostComments()` in a fully type safe interface.

tRPC structures your API as RPC calls such as `/trpc/getPosts` or `/trpc/getPostComments` etc, this provides an arguably simpler API for the client implementation, however, you loose the predictability of REST(ish) APIs if you have consumers who aren't in Typescript (able to us @ts-rest) or public consumers.

tRPC has many plugins to solve this issue by mapping the API implementation to a REST-like API, however, these approaches are often a bit clunky and reduce the safety of the system overall, ts-rest does this heavy lifting in the client and server implementations rather than requiring a second layer of abstraction and API endpoint(s) to be defined.

| **Features**      | REST | tRPC  | tREST  |
| ----------------- | ---- | ----- | ------ |
| E2E Type Safe     | ❌   | ✅    | ✅     |
| Protocol          | REST | RPC   | REST   |
| Public API        | ✅   | ❌    | ✅     |
| Zod/Yup/Joi       | ❌   | ✅    | 🏗 v1.0 |
| WebSocket Support | ❌   | ✅    | ❌     |
| Cmd+Click Access  | ❌   | 🏗 v10 | ✅     |
| Separate Contract | ❌   | ❌    | ✅     |

ts-rest also supports [Nest](https://nestjs.com/), it appears adding Nest to tRPC is against the Nest controller principles, so it is not recommended.

| **Libraries Support** | REST | tRPC        | tREST  |
| --------------------- | ---- | ----------- | ------ |
| Client fetch/custom   | ✅   | ✅          | ✅     |
| Client react-query    | ✅   | ✅          | 🏗 v1.0 |
| Client swr            | ✅   | ✅ (plugin) | 🏗 v1.0 |
| Server Express        | ✅   | ✅          | ✅     |
| Server Nest           | ✅   | ❌          | ✅     |
| Server Next           | ✅   | ✅          | 🏗 v1.0 |

## Implementation - API

### Contract

This can be defined in a shared library, shared package, or in the backend

```typescript
import { initTsCont } from 'ts-rest-core';

const c = initTsCont();

export type Post = {
  id: number;
  title: string;
  body: string;
};

export const router = c.router({
  posts: c.router({
    getPost: c.query({
      method: 'GET',
      path: ({ id }: { id: string }) => `/posts/${id}`,
      response: c.response<Post>(),
    }),
    getPosts: c.query({
      method: 'GET',
      path: () => '/posts',
      response: c.response<Post[]>(),
    }),
  }),
});
```

### Client

This is the basic client library, without react-query or swr.

```typescript
const client = initClient(router, {
  api: fetchApi,
  baseUrl: 'http://localhost:3333',
  baseHeaders: {},
});

const { data } = await client.posts.getPost({ id: 'post-1' });
```

### Server (Express)

ts-rest/express provides a fully type safe implementation of the API contract, with param, query, and body parsing alongside optional Zod support (highly recommended).

```typescript
const app = express();

// Post Router
const postsRouter = s.router(router.posts, {
  getPost: async ({ id }) => {
    const post = database.findOne(id);

    return post ?? null;
  },
  getPosts: async () => {
    const posts = database.findAll();

    return posts;
  },
});

// Combine the routers
const completeRouter = s.router(router, {
  posts: postsRouter,
});

// Instantiates
// GET: /posts/:id
// GET: /posts
createExpressEndpoints(router, completeRouter, app);
```

### Server (Nest.js)

Controller shape is type safe, as are the params and function returns, this is slightly less safe than express, which is entirely functional, this is just a nuisance of Nest, most issues can be alleviated and still be type safe.

```typescript
const s = initNestServer(router.posts);
type ControllerShape = typeof s.controllerShape;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly appService: AppService) {}

  // GET: /posts
  @Get(s.paths.getPosts)
  async getPosts() {
    const posts = this.appService.findAll();

    return posts;
  }

  // GET: /posts/:id
  @Get(s.paths.getPost)
  async getPost(@Param() { id }: { id: string }) {
    const post = this.appService.findOne(id);

    return post ?? null;
  }
}
```
