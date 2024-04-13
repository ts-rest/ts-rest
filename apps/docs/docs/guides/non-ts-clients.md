# Without TS Clients

In a brownfield code base, it's common that you may not have the luxury of having TypeScript end-to-end. For instance, you might have an Android/iOS/Flutter app written in Java/Kotlin/Swift and want to add TypeScript to your backend.

One solution to this is the `@ts-rest/open-api` package, which allows you to generate a OpenAPI spec from your TypeScript code, and then use a tool like [Swagger Codegen](https://swagger.io/tools/swagger-codegen/) to generate a client library for your target language.

```typescript
import { myContract } from './my-api';
import { generateOpenApi } from '@ts-rest/open-api';

const openApiDocument = generateOpenApi(myContract, {
  info: {
    title: 'Posts API',
    version: '1.0.0',
  },
});
```

Heres an example from our [OpenAPI Docs](/docs/open-api) page, so take a look there for more info, but it's pretty easy to get started - please let us know if you have any questions.
