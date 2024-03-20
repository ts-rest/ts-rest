# Configuration

There are a number of configuration options that you can use to customize the behavior of `ts-rest` in your Nest application.

## Configuration Options

### jsonQuery

#### Default value: `false`

By default, all query parameters are encoded as strings, however, you can use the `jsonQuery` option to encode query parameters as typed JSON values.

### validateResponses

#### Default value: `false`

You can enable response parsing and validation for defined response status codes, if there are corresponding response Zod schema defined in the contract.
This is useful for ensuring absolute safety that your controller is returning the correct response types as well as stripping any extra properties.

If validation fails a `ResponseValidationError` will be thrown causing a 500 response to be returned.
You can catch this error and handle it as you wish by using a [NestJS exception filter](https://docs.nestjs.com/exception-filters).

### Request Validation

By default, `ts-rest` validates all request components - body, headers and query parameters.
In case of validation errors, the server responds with a `ZodError` object in the response body and a status code of 400.
You can disable the validation of these components if you wish to perform the validation manually or handle the error differently.

#### Options

- `validateRequestBody`
- `validateRequestQuery`
- `validateRequestHeaders`

#### Default values: `true`

#### Example

```typescript
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

@Controller()
export class MyController {
  constructor() {}

  @TsRestHandler(c.getPost, {
    validateRequestBody: false,
    validateRequestQuery: false,
    validateRequestHeaders: false
  })
  async getPost() {
    return tsRestHandler(c.getPost, async ({ query, body }) => {
      const isQueryValid = querySchema.safeParse(query);
      console.log(isQueryValid) // => { success: false; error: ZodError }

      const isBodyValid = bodySchema.safeParse(body);
      console.log(isBodyValid) // => { success: true; data: {...} }
    });
  }
}
```

## Global Configuration

Configuring the different configuration options for each controller might get a bit cumbersome.
To make it easier, you can set global options that will be used by all controllers in your Nest module, or globally across your application if you specify `isGlobal`.

```typescript
import { Module } from '@nestjs/common';
import { TsRestModule } from '@ts-rest/nest';

@Module({
  imports: [
    TsRestModule.register({
      isGlobal: true,
      jsonQuery: true,
      validateResponses: true,
    }),
  ],
})
export class AppModule {}
```
