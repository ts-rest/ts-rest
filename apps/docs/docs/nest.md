# Nest

By default Nest doesn't offer a nice way to ensure type safe controllers, primarily because it's decorator driven rather than functional, like Express.

```typescript
const s = initNestServer(apiBlog);
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;

@Controller()
export class PostController implements ControllerShape {
  constructor(private readonly postService: PostService) {}

  @Api(s.route.getPost)
  async getPost(@ApiDecorator() { params: { id } }: RouteShape['getPost']) {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }
}
```

The `@Api` decorator takes the route, defines the path and method for the controller route.

It also injects "appRoute" into the req object, allowing the `@ApiDecorator` decorator automatically parse and check the query and body parameters.
