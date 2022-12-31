# Nest

By default Nest doesn't offer a nice way to ensure type safe controllers, primarily because it's decorator driven rather than functional, like Express.

```typescript
const s = initNestServer(apiBlog);
type ControllerShape = typeof s.controllerShape;
type RouteShape = typeof s.routeShapes;
type ResponseShapes = typeof s.responseShapes;

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


## Response Return Type Safety

You have two options to ensure HTTP type safety on your Nest Controllers: 

- `ControllerShape` as shown above: 
  - Your controller can implement the `ControllerShape` derived from `typeof s.controllerShape`
  - This ensures your controller methods also align with the base interface shapes
- `ResponseShapes`:
  - Your controller can utilize `typeof s.responseShapes` in the return type. For example:
    ```typescript
    const s = initNestServer(apiBlog);
    type ControllerShape = typeof s.controllerShape;
    type RouteShape = typeof s.routeShapes;
    type ResponseShapes = typeof s.responseShapes; // <- http Responses defined in contract

    @Controller()
    export class PostController {
      constructor(private readonly postService: PostService) {}

      @Api(s.route.getPost)
      async getPost(@ApiDecorator() { params: { id } }: RouteShape['getPost']):
      Promise<ResponseShapes['getPost']> { // <- return type defined here
        const post = await this.postService.getPost(id);

        if (!post) {
          return { status: 404, body: null };
        }

        return { status: 200, body: post };
      }
    }
    ```
  - If your controller needs to implement a difference class, or needs extra methods defined outside of a contract, this is option gives that flexibility without having to worry about maintaining class extensions. 


:::caution

Currently any existing Nest global prefix, versioning, or controller prefixes will be ignored, please see https://github.com/ts-rest/ts-rest/issues/70 for more details.

If this feature is highly requested, we can investigate a solution.

Currently the path in your contract must be the **full path**, your client may specify a different base url, with a prefix, but this cannot be done at the contract level currently.

e.g. if your client is at `https://api.example.com/v1` and your contract is at `/posts`, the client will make a request to `https://api.example.com/v1/posts`.

:::
