# Azure Functions

The Azure Function handler can handle the Azure Functions V4 programming model.

```typescript
import { app } from '@azure/functions';
import { createAzureFunctionHandler } from '@ts-rest/serverless/azure';
import { contract } from './contract';
import { router } from './router';

const handler = createAzureFunctionHandler(contract, router, {
  // options
});

// This will register a single function handler for the handler
app.http('api', {
  // Be sure to include any method that the router requires
  methods: ['POST', 'PATCH', 'DELETE', 'GET'],
  authLevel: 'anonymous',
  route: '{*route}',
  handler,
});
```

## Route Prefix

By default, Azure Functions have a route prefix `api` for every route registered. Unless you specifically have the same in your contract, then you will need to add the following to the end of your `host.json` file to remove this prefix.

```json
// host.json
{
  ...,
  "extensions": {
    "http": {
      "routePrefix": ""
    }
  }
}
```

## Context Object

In addition to the regular context properties, the context object for Azure Function handlers includes the following additional properties:

- `rawHttpRequest: HttpRequest`: The raw request that was passed to the Azure Function
- `azureContext: InvocationContext`: The Azure Function Invocation Context passed with each invocation of a function

```typescript
import { createAzureFunctionHandler } from '@ts-rest/serverless/azure';
import { contract } from './contract';

export const handler = createAzureFunctionHandler(
  contract,
  {
    getPost: async ({ params: { id } }, { azureContext, rawHttpRequest }) => {
      azureContext.log('Received request!');

      return {
        status: 200,
        body: {
          id,
          title: 'Hello, World!',
        },
      };
    },
  },
  {
    requestMiddleware: [
      (request, { rawHttpRequest, azureContext }) => {
        console.log('Raw HttpRequest:', rawHttpRequest);
        console.log('Azure Invocation Context:', azureContext);
      },
    ],
    responseHandlers: [(response, request, { rawHttpRequest, azureContext }) => {}],
  },
);
```
