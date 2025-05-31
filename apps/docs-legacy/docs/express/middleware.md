# Middleware

You can add middleware to your routes through ts-rest directly instead of having to attach them to your app directly.
They are regular Express.js request handlers, but with the added benefit of having
a typed contract route attached to the Request object at `req.tsRestRoute`.

This allows you to pass metadata from your contract to your middleware to be used for authorization, logging, etc.

## Route Middleware

In the below example we show how you can add middleware that only runs for a specific route.

```typescript
import { initServer } from '@ts-rest/express';
import { contract } from './contract';

const s = initServer();

const router = s.router(contract, {
  getPost: {
    middleware: [
      (req, res, next) => {
        // req.tsRestRoute is typed as the contract route
        console.log('Called: ', req.tsRestRoute.method, req.tsRestRoute.path);
        // prints: Called: GET /posts/:id
        next();
      }
    ],
    handler: async ({ params: { id } }) => {
      const post = prisma.post.findUnique({ where: { id } });

      return {
        status: 200,
        body: post ?? null,
      };
    }
  },
});

createExpressEndpoints(contract, router, app);
```

## Global Middleware

You can also add middleware that runs for all routes in a contract. These run before any route-specific middleware.

```typescript
import { initServer } from '@ts-rest/express';
import { contract } from './contract';

const s = initServer();

const router = s.router(contract, {
  getPost: {
    middleware: [
      (req, res, next) => {
        // req.tsRestRoute is typed as the contract route
        console.log('Called: ', req.tsRestRoute.method, req.tsRestRoute.path);
        //                                   'GET' ^        '/posts/:id'  ^ 
        next();
      }
    ],
    handler: async ({ params: { id } }) => {
      const post = prisma.post.findUnique({ where: { id } });

      return {
        status: 200,
        body: post ?? null,
      };
    }
  },
});

createExpressEndpoints(contract, router, app, {
  globalMiddleware: [passport.authenticate('jwt', { session: false })]
});
```
