# Error Handling

If a request fails, the `error` property will be set to the response from the server, or the thrown error by `fetch`. This is the same as the `data` property for successful requests.

The type of the `error` property on the React Query hooks will be set as `{ status: ...; body: ...; headers: ... } | Error`, where status is a non-2xx status code, and `body`
set to your response schema for status codes defined in your contract, or `unknown` for status codes not in your contract.

The `Error` type is included because requests can fail without returning a response. See [Fetch#Exceptions](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch#exceptions) for more information.

```tsx
import { isFetchError } from '@ts-rest/react-query/v5';
import { tsr } from './tsr';

const Post = ({ id }: { id: string }) => {
  const { data, error, isPending } = tsr.getPost.useQuery({
    queryKey: ['posts', id],
    queryData: {
      params: { id },
    },
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    if (isFetchError(error)) {
      return <div>We could not retrieve this post. Please check your internet connection.</div>;
    }
    
    if (error.status === 404) {
      return <div>Post not found</div>;
    }

    return <div>Unexpected error occurred</div>;
  }

  return (
    <div>
      <h1>{data.body.title}</h1>
      <p>{data.body.content}</p>
    </div>
  );
};
```

## Fully Type-Safe Error Handling

In order to ensure that your code is handling all possible error cases, there are type guard functions that have been provided to help the handling of both expected and unexpected errors.

- `isFetchError(error)` - Returns `true` if the error is an instance of `Error` thrown by `fetch`.
- `isUnknownErrorResponse(error, contractEndpoint)` - Returns `true` if the error, if a response has been received but the status code is not defined in the contract.
- `isNotKnownResponseError(error, contractEndpoint)` - Combines `isFetchError` and `isUnknownErrorResponse`, in case you want to be able to quickly type guard into defined error responses in one statement.
- `exhaustiveGuard(error)` - Check if all possible error cases have been handled. Otherwise, you get a compile-time error.

We also return the `contractEndpoint` property from all hooks, so you can easily pass it to the types guards without having import the contract.

```tsx
import { isFetchError, isUndefinedErrorResponse, exhaustiveGuard } from '@ts-rest/react-query/v5';
import { tsr } from './tsr';

const Post = ({ id }: { id: string }) => {
  const { data, error, isPending, contractEndpoint } = tsr.getPost.useQuery({
    queryKey: ['posts', id],
    queryData: {
      params: { id },
    },
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    if (isFetchError(error)) {
      return <div>We could not retrieve this post. Please check your internet connection.</div>;
    }
    
    if (isUndefinedErrorResponse(error, contractEndpoint)) {
      return <div>Unexpected error occurred</div>;
    }

    if (error.status === 404) {
      return <div>Post not found</div>;
    }

    // this should be unreachable code if you handle all possible error cases
    // if not, you will get a compile-time error on the line below
    return exhaustiveGuard(error);
  }

  return (
    <div>
      <h1>{data.body.title}</h1>
      <p>{data.body.content}</p>
    </div>
  );
};
```
