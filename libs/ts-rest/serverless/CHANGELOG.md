# @ts-rest/serverless

## 3.48.0

### Patch Changes

- @ts-rest/core@3.48.0

## 3.47.0

### Minor Changes

- eb2c647: BREAKING CHANGE: The order of generics on the `tsr.*` methods have been swapped. Now you don't have to pass `typeof contract` first. You can now pass your request extension type only.
- eb2c647: Make sure initialized client and router types are exported so they can be re-exported with types emitted
- eb2c647: Fluent router builder for easier modification of request context type in middleware. Try it out through `tsr.routerBuilder(contract)`!

### Patch Changes

- @ts-rest/core@3.47.0

## 3.46.0

### Minor Changes

- d763d45: Export `RequestValidationErrorSchema` for default request validation error responses.
- 72fd14e: Add Azure Functions compatibility

### Patch Changes

- Updated dependencies [d763d45]
  - @ts-rest/core@3.46.0

## 3.45.2

### Patch Changes

- f5febbf: Change response handler type to accept promises
  - @ts-rest/core@3.45.2

## 3.45.1

### Patch Changes

- @ts-rest/core@3.45.1

## 3.45.0

### Patch Changes

- @ts-rest/core@3.45.0

## 3.44.1

### Patch Changes

- 08878f0: Create type helpers for route-level middleware context
  - @ts-rest/core@3.44.1

## 3.44.0

### Patch Changes

- Updated dependencies [60f90fa]
- Updated dependencies [45e5104]
  - @ts-rest/core@3.44.0

## 3.43.0

### Minor Changes

- 308b966: `TsRestResponseError` can be thrown from any server package
- 05e8a92: Add ability to include custom platform context for serverless fetch handler

### Patch Changes

- Updated dependencies [308b966]
  - @ts-rest/core@3.43.0

## 3.42.0

### Minor Changes

- 7108c19: Add middleware support

### Patch Changes

- Updated dependencies [7372bee]
  - @ts-rest/core@3.42.0

## 3.41.2

### Patch Changes

- b6bd2ed: Fix module resolution when not using node16 or nodenext
  - @ts-rest/core@3.41.2

## 3.41.1

### Patch Changes

- d107181: Fix broken type for `@ts-rest/serverless/next` handler
  - @ts-rest/core@3.41.1

## 3.41.0

### Patch Changes

- Updated dependencies [fc0adc6]
  - @ts-rest/core@3.41.0

## 3.40.1

### Patch Changes

- Updated dependencies [afa5066]
- Updated dependencies [afa5066]
  - @ts-rest/core@3.40.1

## 3.40.0

### Minor Changes

- fa7219d: Support Next.js App Router route handlers

### Patch Changes

- @ts-rest/core@3.40.0

## 3.39.2

### Patch Changes

- Updated dependencies [dc554da]
  - @ts-rest/core@3.39.2

## 3.39.1

### Patch Changes

- @ts-rest/core@3.39.1

## 3.39.0

### Minor Changes

- 860e402: Add contract definition for an absent body and handle accordingly on the server

### Patch Changes

- Updated dependencies [8f4cfe6]
- Updated dependencies [860e402]
- Updated dependencies [487b2b6]
  - @ts-rest/core@3.39.0

## 3.38.0

### Patch Changes

- Updated dependencies [0b9f249]
- Updated dependencies [15d4926]
  - @ts-rest/core@3.38.0

## 3.37.0

### Patch Changes

- Updated dependencies [6a5280c]
- Updated dependencies [77db06b]
  - @ts-rest/core@3.37.0

## 3.36.0

### Patch Changes

- Updated dependencies [c7e05d8]
  - @ts-rest/core@3.36.0

## 3.35.1

## 3.35.0

### Minor Changes

- bacc9d1: New serverless library for AWS Lambda, Edge runtimes and Next.js-specific Edge runtime

### Patch Changes

- @ts-rest/core@3.35.0
