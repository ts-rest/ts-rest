# Server Errors

To return errors that are defined in your contract from your server, you can throw a `TsRestResponseError` from anywhere within your code,
and it will be caught by ts-rest and served as a response. It will still go through any response validations that are enabled.

```typescript
import { TsRestResponseError } from '@ts-rest/core';
import { contract } from './contract';

// anywhere in your code
throw new TsRestResponseError(contract.getPost, {
  status: 404,
  body: { message: 'Not Found' },
});
```

:::caution

Any thrown `TsRestResponseError` will NOT be caught by any error handlers, and will be served as a response straight away.

:::
