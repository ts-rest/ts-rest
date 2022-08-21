---
sidebar_position: 2
---

# tRPC Comparison

I _love_ [tRPC](https://trpc.io/), [KATT (Alex Johansson)](https://github.com/KATT) and all the [other maintainers](https://github.com/trpc/trpc/graphs/contributors) have done some amazing work, and for applications with a single Next.js app, or an express server only consumed by TRPC clients, I whole heartily recommend using tRPC! Also I have undoubtedly taken inspiration from tRPC for tREST.

One of the biggest differences between tRPC and tREST is that tRPC defines your API implementation _as the contract_, for some use cases it is beneficial to have a separate contract to represent the API.

One example of this is with NX, in NX you can rebuild only "affected" packages, however, if you export your contract (e.g. tRPC) from the backend, your front end will need to be rebuilt as well. tREST negates this issue by allowing (in NX) for a library for the API contract to be created, this then means the only case in which the front and backend need to be rebuilt is when the contract changes.

## REST(ish) vs RPC

> REST(ish)? REST is a term the industry (as a whole) has used incorrectly for many years now. In recent years, it is used as a synonym for HTTP requests over a API. [Read more here](https://htmx.org/essays/how-did-rest-come-to-mean-the-opposite-of-rest/)

tREST allows you design an API as you would "normally", e.g. GET, POST, PUT, DELETE etc. to `/posts`, `/posts/:id`, `/posts/:id/comments` etc. whilst providing these endpoints to the client as RPC-type calls like `client.posts.getPost({ id: "1" })` or `client.posts.getPostComments()` in a fully type safe interface.

tRPC structures your API as RPC calls such as `/trpc/getPosts` or `/trpc/getPostComments` etc, this provides an arguably simpler API for the client implementation, however, you loose the predictability of REST(ish) APIs if you have consumers who aren't in Typescript (able to us @ts-rest) or public consumers.

tRPC has many plugins to solve this issue by mapping the API implementation to a REST-like API, however, these approaches are often a bit clunky and reduce the safety of the system overall, tREST does this heavy lifting in the client and server implementations rather than requiring a second layer of abstraction and API endpoint(s) to be defined.

| **Features**      | REST | tRPC  | tREST  |
| ----------------- | ---- | ----- | ------ |
| E2E Type Safe     | ❌   | ✅    | ✅     |
| Protocol          | REST | RPC   | REST   |
| Public API        | ✅   | ❌    | ✅     |
| Zod/Yup/Joi       | ❌   | ✅    | 🏗 v1.0 |
| WebSocket Support | ❌   | ✅    | ❌     |
| Cmd+Click Access  | ❌   | 🏗 v10 | ✅     |
| Separate Contract | ❌   | ❌    | ✅     |

tREST also supports [Nest](https://nestjs.com/), it appears adding Nest to tRPC is against the Nest controller principles, so it is not recommended.

| **Libraries Support** | REST | tRPC        | tREST  |
| --------------------- | ---- | ----------- | ------ |
| Client fetch/custom   | ✅   | ✅          | ✅     |
| Client react-query    | ✅   | ✅          | 🏗 v1.0 |
| Client swr            | ✅   | ✅ (plugin) | 🏗 v1.0 |
| Server Express        | ✅   | ✅          | ✅     |
| Server Nest           | ✅   | ❌          | ✅     |
| Server Next           | ✅   | ✅          | 🏗 v1.0 |
