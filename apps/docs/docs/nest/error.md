# Error Handling

By default `@ts-rest/nest` helps you deal with errors in a type safe way, once they are typed in your contract all you have to do is return the status code in the function response

```typescript
@Api(s.route.getPost)
async getPost(@ApiDecorator() { params: { id } }: RouteShape['getPost']) {
  const post = await this.postService.getPost(id);

  if (!post) {
    return { status: 404 as const, data: null };
  }

  return { status: 200 as const, data: post };
}
```

In this case the `@ApiDecorator` decorator automatically returns the correct status code and data.

## Opt Out

If you want to customise the behaviour of Nest, feel free to not use the `@ApiDecorator` decorator and instead just use regular Nest decorators.

```typescript
createPost: c.mutation({
  method: 'POST',
  path: () => '/posts',
  responses: {
    201: c.response<Post>(),
  },
  body: z.object({
    title: z.string(),
    content: z.string(),
    published: z.boolean().optional(),
    description: z.string().optional(),
  }),
  summary: 'Create a post',
}),
```

Request with missing body parameter

```json
POST {{host}}/posts HTTP/1.1
content-type: application/json

{
  "title": "Post Title"
}
```

Response with Zod error

```json
{
  "errors": [
    {
      "code": "invalid_type",
      "expected": "string",
      "received": "undefined",
      "path": ["content"],
      "message": "Required"
    }
  ]
}
```
