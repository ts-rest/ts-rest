# Nest

As opposed to the Express implementation, where we can infer types from a function signature, we need to explicitly define our types since Nest controllers are implemented as classes.

```typescript
import {
  Api,
  nestControllerContract,
  NestControllerInterface,
  NestRequestShapes,
  TsRestRequest,
} from '@ts-rest/nest';

const c = nestControllerContract(apiBlog);
type RequestShapes = NestRequestShapes<typeof c>;

@Controller()
export class PostController implements NestControllerInterface<typeof c> {
  constructor(private readonly postService: PostService) {}

  @Api(c.getPost)
  async getPost(@TsRestRequest() { params: { id } }: RequestShapes['getPost']) {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }
}
```

The `nestControllerContract` filters your contract to only include immediate routes and no nested routes. Otherwise, you'd have to implement the entire contract in a single controller. As a result, it's good practice to design your contract into multiple nested contracts, one for each controller.

To implement a nested contract, you can simply call `nestControllerContract(contract.nestedContract)`

Having the controller class implement `NestControllerInterface` ensures that your controller implements all the routes defined in the contract. In addition, it ensures the type safety of the responses returned.

The `@Api` decorator takes the route, defines the path and method for the controller route.

The `@TsRestRequest` decorator takes the contract route defined in the `@Api` decorator, and returns the parsed and validated (if using Zod) request params, query and body.

As Typescript cannot infer class method parameter types from an implemented interface, we need to explicitly define the type for the request parameter using the `NestRequestShapes` type. 

## Configuration

To configure certain ts-rest options you can use the `@TsRest()` decorator on either your Controller classes or individual endpoint methods.

### JSON Query Parameters

To handle JSON query parameters, pass the `jsonQuery` option to the `@TsRest()` decorator.

```typescript
@Controller()
@TsRest({ jsonQuery: true })
export class PostController implements NestControllerInterface<typeof c> {}
```

The method decorator can be useful to override the controller's behaviour on a per-endpoint basis.

```typescript
@Controller()
@TsRest({ jsonQuery: true })
export class PostController implements NestControllerInterface<typeof c> {
  constructor(private readonly postService: PostService) {}

  @Api(s.route.getPost)
  @TsRest({ jsonQuery: false })
  async getPost(@TsRestRequest() { params: { id } }: RequestShapes['getPost']) {
    // ...
  }
}
```

### Response Validation

You can enable response validation by passing the `validateResponses` option to the `@TsRest()` decorator.
This will enable response parsing and validation for a returned status code, if there is a corresponding response Zod schema defined in the contract.
This is useful for ensuring absolute safety that your controller is returning the correct response types as well as stripping any extra properties.

```typescript
@Controller()
@TsRest({ validateResponses: true })
export class PostController implements NestControllerInterface<typeof c> {}
```

If validation fails a `ResponseValidationError` will be thrown causing a 500 response to be returned.
You can catch this error and handle it as you wish by using a [NestJS exception filter](https://docs.nestjs.com/exception-filters).

## Explicit Response Type Safety

In cases where you do not want to implement `NestControllerInterface`.
Say, if you were to implement a contract's non-nested routes across multiple controllers, or use different class method names than the ones defined in your contract, you can still ensure type safety of the responses by using the `NestResponseShapes` type.

```typescript
import {
  Api,
  nestControllerContract,
  NestRequestShapes,
  NestResponseShapes,
  TsRestRequest,
} from '@ts-rest/nest';

const c = nestControllerContract(apiBlog);
type RequestShapes = NestRequestShapes<typeof c>;
type ResponseShapes = NestResponseShapes<typeof c>;

@Controller()
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Api(c.getPost)
  async getPost(
    @TsRestRequest() { params: { id } }: RequestShapes['getPost']
  ): Promise<ResponseShapes['getPost']> {
    const post = await this.postService.getPost(id);

    if (!post) {
      return { status: 404 as const, body: null };
    }

    return { status: 200 as const, body: post };
  }
}
```

:::caution

Currently any existing Nest global prefix, versioning, or controller prefixes will be ignored, please see https://github.com/ts-rest/ts-rest/issues/70 for more details.

If this feature is highly requested, we can investigate a solution.

Currently the path in your contract must be the **full path**, your client may specify a different base url, with a prefix, but this cannot be done at the contract level currently.

e.g. if your client is at `https://api.example.com/v1` and your contract is at `/posts`, the client will make a request to `https://api.example.com/v1/posts`.

:::
