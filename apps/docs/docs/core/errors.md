# Error Handling

:::tip

This is completely optional, you can just use non-typed error handling and only care about general success/failure cases.

:::

To handle errors safety you have the option to pass a status code in the response object.

```typescript
export const routerBasic = c.router({
  updateUser: c.mutation({
    method: 'PATCH',
    path: ({ id }: { id: string }) => `/basic/users/${id}`,
    response: {
      200: c.response<User>(),
      400: c.response<{ message: string }>(),
    },
    body: c.body<{ name: string | null; email: string | null }>(),
    summary: 'Update a user',
  }),
});
```

## Client

The default fetch client has support for this,

```typescript
const { status, data } = await client.user({ params: { id: '1' } });

if (status === 200) {
  console.log(data.email);
} else if (status === 400) {
  console.log('Not found');
} else {
  console.log('Something went wrong');
}
```

:::info

The typed response includes the typed status codes along with any other possible statuses

```typescript
type Response = {
    status: 200;
    data: User;
} | {
    status: 400;
    data: null;
} | {
    status: 100 | 101 | 102 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 300 | 301 | 302 | 303 | 304 | 305 | 307 | 308 | 401 | 402 | ... 33 more ... | 511;
    data: unknown;
}
```

:::
