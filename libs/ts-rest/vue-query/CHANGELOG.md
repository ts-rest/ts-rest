# @ts-rest/vue-query

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
