# @ts-rest/vue-query

## 3.33.0

## 3.32.0

## 3.31.0

### Minor Changes

- 29fe85b: feat: `@ts-rest/react-query` use object-syntax in react-query to support [@tanstack/react-query@^5.0.0](https://tanstack.com/query/latest/docs/react/guides/migrating-to-v5)

  - note: This does **not** implement a complete migration to v5 but lays the groundwork to get the ball rolling and apps running again.

  feat: `@ts-rest/vue-query` add @tanstack/vue-query@^5.0.0 as peer dependency

## 3.30.5

### Patch Changes

- 9bd7402: - `@ts-rest/fastify` fix: fastify deprecated routerPath property (fixes [#392](https://github.com/ts-rest/ts-rest/issues/392))
  - `@ts-rest/open-api` fix: Pass through contentType to OpenApi schema ([#414](https://github.com/ts-rest/ts-rest/pull/414))
  - `@ts-rest/core` fix: Content-type text/html returns blob body (fixes [#418](https://github.com/ts-rest/ts-rest/issues/418))
- 8cc95c5: add changeset for latest changes

## 3.30.4

### Patch Changes

- 10dff96: - fix: address `zod` [CVE](https://nvd.nist.gov/vuln/detail/CVE-2023-4316) with bump `@ts-rest` peer dependency `zod` to minimum `^3.22.3`
  - ref PR: https://github.com/colinhacks/zod/pull/2824

## 3.30.3

## 3.30.2

### Patch Changes

- bd0161b: fix: content-type application/json will not be automatically included in client request if the route is GET or body is undefined/null

## 3.30.1

## 3.30.0

## 3.29.0

### Minor Changes

- 2feedbb: Adds new `@ts-rest/vue-query` package!
  - feat: add support @tanstack/vue-query
  - feat: add docs for @tanstack/vue-query package
