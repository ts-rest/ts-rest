# Error Handling

Since 2.0 ts-rest-api has a built-in error handling, all you need to do is define the response status codes in the contract. The Nest/Express libraries handle the rest for you, letting you utilise HTTP status codes fully without worrying about type safety!

```typescript
export const routerBasic = c.router({
  updateUser: {
    method: 'PATCH',
    path: `/basic/users/:id`,
    response: {
      200: c.type<User>(),
      400: c.type<{ message: string }>(),
    },
    body: c.type<{ name: string | null; email: string | null }>(),
    summary: 'Update a user',
  },
});
```

## Client Errors

The default fetch client has support for this,

```typescript
const { status, body } = await client.user({ params: { id: '1' } });

if (status === 200) {
  console.log(body.email);
} else if (status === 400) {
  console.log('Not found');
} else {
  console.log('Something went wrong');
}
```

### Client Error Typing

:::info

The typed response includes the typed status codes along with any other possible statuses

```typescript
const updatedUser: {
    status: 200;
    body: User
} | {
    status: 400;
    body: {
        message: string;
    }
} | {
    status: 100 | 101 | 102 | 201 | 202 | 203 | ... 47 more ... | 511;
    body: unknown;
}
```

:::
