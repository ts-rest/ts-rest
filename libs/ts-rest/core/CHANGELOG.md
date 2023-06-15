# @ts-rest/core

## 3.26.3

## 3.26.2

## 3.26.1

## 3.26.0

### Minor Changes

- fcf877d: Allow defining non-json response types in the contract
- 48b138d: Add new `SingleHandler` and `MultiHandler` API to `@ts-rest/nest`
- 2763208: Added `pathPrefix` to contract options to allow recursive path prefixing.

## 3.25.1

### Patch Changes

- 81560d4: Fix ESM/CJS issues in package.json

## 3.25.0

### Patch Changes

- bf21a75: Internal refactor of types

## 3.24.0

## 3.23.0

### Minor Changes

- 74bb4a8: Implement strict mode at a contract level. Strict mode ensures that only known responses are allowed by the type system. This applies both on the server and client side. Enable this with `strictStatusCodes: true` when defining a contract. If you would like to have the vanilla client throw an error when the response status is not known then you will need to use `throwOnUnknownStatus` when initializing the client.
- df77869: Response headers are now exposed to clients. Users of custom API fetchers should start returning headers.
- 74e41dc: Add 'metadata' property to routes

### BREAKING CHANGES FOR CUSTOM API FETCHERS

If you are using a custom API fetcher, you need to start returning response headers from your fetcher as a Web API [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers) interface.

If you are using `fetch`, just simply return `response.headers`.

If you are using `axios`, you can return `new Headers(response.headers.toJSON())`

## 3.22.0

### Minor Changes

- d61b127: Implement tanstack query cancellation
- 1c53ac9: Add `throwOnUnknownStatus` to `initClient` configuration. When set to `true` the client will throw errors for all status codes returned by the server which are not defined in the contract.

## 3.21.2

## 3.21.1

### Patch Changes

- 1b4ef1e: Fix incorrect detection of zod objects with nested ZodEffects and fix regression with validation

## 3.21.0

### Minor Changes

- b2bf874: Added React Query QueryClient function helpers

### Patch Changes

- 8729bb5: Fix node16 esm module resolution
- b2bf874: Add rawQuery parameter to custom API fetcher parameters

## 3.20.0

### Minor Changes

- c1c1d31: Add type-safe header definitions to contracts

## 3.19.5

### Patch Changes

- 574dbab: Improved Zod object detection in OpenAPI

## 3.19.4

### Patch Changes

- 4b6e9f6: Filter out undefined values from json queries

## 3.19.3

## 3.19.2

### Patch Changes

- 96ab6bd: Revert ESM fix, due to failed compilation on Next.js

## 3.19.1

### Patch Changes

- 5e1c6a2: feat: add rawBody and contentType to Custom Client API arguments
- ecac73d: Fix compatibility with Node.js TS native ESM code

## 3.19.0

### Minor Changes

- 2bb39f8: Added inference type helpers

## 3.18.1

### Patch Changes

- 9bd4c77: Fixes broken typing where sometimes the client's request args were incorrectly typed as optional

## 3.18.0

### Minor Changes

- 3fa43d9: Export the default fetch API as `tsRestFetchApi` from the core library, enables you to easy modify the fetcher
- 3fa43d9: Add the ability to remove a baseHeader on a per-request basis by setting the headers value to undefined
- 3fa43d9: Allow custom API to allow extra args, and type them in the individual api calls
- 3fa43d9: Prettify the arguments of API calls, making it much clearer what data should be passed to ts-rest api calls (thanks @mattpocockuk!)

## 3.17.0

## 3.16.2

### Patch Changes

- 3fa8679: Do not throw error for missing content-type header

## 3.16.1

### Patch Changes

- 832b645: fix(core): wrong "content-type" detection

## 3.16.0

### Minor Changes

- e490cf3: - Added server-side response validation feature
- Deprecated `@Api` decorator, use `@TsRest` instead

## 3.15.0

### Patch Changes

- 0f1edf9: Rename some Nest functions and types, and deprecate old names

- Fix Nest deprecation warning when passing Zod error to HttpException (#122)

- Some internal helper types (`NestControllerShapeFromAppRouter` and `NestAppRouteShape`) that were previously exported are now kept internal.
  You can use `NestControllerInterface` and `NestRequestShapes` instead.

- 3f65909: Drop usage of ES6 Proxy for clients (fixes IE11 support)

## 3.14.0

### Minor Changes

- 13ca71b: Enable nested routers without declaring new constants

## 3.13.1

### Patch Changes

- d778e60: Rebuilt without code comments in the compiled JS

## 3.13.0

## 3.12.1

### Patch Changes

- e0164f6: Publish README

## 3.12.0

### Minor Changes

- a53a384: Add response shape shape helper to make allow you to extract the response from a Contract route
- 5a13803: Allow typed query parameters by encoding them as JSON strings (disabled by default)

### Patch Changes

- 36e5bd4: Fix typing for query

## 3.11.2

## 3.11.1

## 3.11.0

### Minor Changes

- 57acbad: Added the ability to omit the second parameter if there no required query parameters

## 3.10.2

## 3.10.1

## 3.10.0

### Minor Changes

- 046e498: Use Nest.js req.query and req.params instead of parsing from URL

### Patch Changes

- 35c64db: Move next lib utils out of @ts-rest/core to reduce bundle size

## 3.9.0

## 3.8.0

### Minor Changes

- 59b8d29: Add credentials option for fetch client

### Patch Changes

- 1b3faaf: Use z.input for body and query types for clients

## 3.7.0

### Minor Changes

- d4d9be5: Add support for pathParams Zod verification
- 8a19717: Add pathParams transformations

## 3.6.1

## 3.6.0

### Minor Changes

- 6753c69: Build ESM and CommonJS for improved compatibility

## 3.5.0

### Minor Changes

- 068822d: Add support for multipart/form-data

## 3.4.2

## 3.4.1

## 3.4.0

## 3.3.0

## 3.2.2

## 3.2.1

## 3.2.0

## 3.1.1

### Patch Changes

- d3a74fe: Remove unnecessary recursion

## 3.1.0

## 3.0.0

### Major Changes

- 895112a: Migrate paths to a string rather than function

## 2.1.0

### Minor Changes

- 75f157a: Add Zod validation to @ts-rest/next

## 2.0.1

### Patch Changes

- 119aed6: Bump versions to 2.0.1

## 2.0.0

### Major Changes

- 4792b26: Change contract to support multiple responses, for different statuses
- c88fb99: Rename data to body to be more HTTP spec compliant

### Patch Changes

- 4792b26: Add error handling support to express

## 1.3.0

### Minor Changes

- a5d7e97: Add basic open-api support

### Patch Changes

- 077d57b: Update client to have zod response type
- 5f87b1a: Add OpenAPI options for generateOpenApi

## 1.2.0

### Minor Changes

- 987fd07: Add query and mutation support to react-query, instead of requring useMutation and useQuery

## 1.1.0

### Minor Changes

- 72dd65d: Extract express logic to @ts-rest/express

## 1.0.4

### Patch Changes

- 3adb9c8: Change build path

## 1.0.3

### Patch Changes

- 0d706a3: Sync package versions

## 1.0.2

### Patch Changes

- 1fe80ea: sync versions

## 1.0.1

### Patch Changes

- 8d908ee: Update package scope

## 1.0.0

### Minor Changes

- 86a5cb7: add react-query and nest integration
