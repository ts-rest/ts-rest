---
title: '@ts-test/nest'
sidebar_position: 7
---

# Nest Server

For each "sub-router" in tRPC you can define a new controller, for instance:

```typescript
const s = initNestServer(router.posts);
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly postService: PostService) {}

  @ApiRoute(s.route.getPosts)
  async getPosts(
    @ApiParams() { query: { take, skip } }: RouteShape['getPosts']
  ) {
    const posts = await this.postService.getPosts({ take, skip });

    return posts;
  }
}
```

The `@ApiRoute` decorator takes the route, defines the path and method for the controller route.

It also injects "appRoute" into the req object, allowing the `@ApiParams` decorator automatically parse and check the query and body parameters.

## Zod Body and Query Parsing

If you've defined your body or query using Zod, `@ApiParams` automatically parses and checks the data against the schema. Throwing an error if the data is invalid.
