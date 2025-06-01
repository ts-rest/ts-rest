---
title: 'AWS Lambda'
description: How to use ts-rest with AWS Lambda
---

The AWS Lambda handler can handle API Gateway v1 or v2 events.

```typescript
import { createLambdaHandler } from '@ts-rest/serverless/aws';
import { contract } from './contract';
import { router } from './router';

export const handler = createLambdaHandler(contract, router, {
  // options
});
```

## Context Object

In addition to the regular context properties, the context object for AWS Lambda handlers includes the following additional properties:

- `rawEvent: APIGatewayProxyEvent | APIGatewayProxyEventV2`: The raw event object that was passed to the Lambda function.
- `lambdaContext: Context`: The Lambda context. The type is imported from the `aws-lambda` package.

```typescript
import { createLambdaHandler } from '@ts-rest/serverless/aws';
import { contract } from './contract';

export const handler = createLambdaHandler(
  contract,
  {
    getPost: async ({ params: { id } }, { rawEvent, lambdaContext }) => {
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
      (request, { rawEvent, lambdaContext }) => {
        console.log('Raw Event:', context.rawEvent);
        console.log('Lambda Context:', context.lambdaContext);
      },
    ],
    responseHandlers: [(response, request, { rawEvent, lambdaContext }) => {}],
  },
);
```
