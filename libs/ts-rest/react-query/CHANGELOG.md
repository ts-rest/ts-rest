# @ts-rest/react-query

## 3.20.0

### Minor Changes

- c1c1d31: Add type-safe header definitions to contracts

## 3.19.5

## 3.19.4

## 3.19.3

### Patch Changes

- 5ee543f: Export ts-rest react-query types

## 3.19.2

### Patch Changes

- 96ab6bd: Revert ESM fix, due to failed compilation on Next.js

## 3.19.1

### Patch Changes

- 5e1c6a2: feat: add rawBody and contentType to Custom Client API arguments
- ecac73d: Fix compatibility with Node.js TS native ESM code

## 3.19.0

## 3.18.1

## 3.18.0

### Minor Changes

- 3fa43d9: Allow custom API to allow extra args, type them in the react query api calls
- 3fa43d9: Add the ability to remove a baseHeader on a per-request basis by setting the headers value to undefined
- 3fa43d9: Prettify the arguments of API calls, making it much clearer what data should be passed to ts-rest api calls (thanks @mattpocockuk!)

## 3.17.0

## 3.16.2

## 3.16.1

## 3.16.0

## 3.15.0

### Patch Changes

- 3f65909: Drop usage of ES6 Proxy for clients (fixes IE11 support)

## 3.14.0

## 3.13.1

### Patch Changes

- d778e60: Rebuilt without code comments in the compiled JS

## 3.13.0

### Minor Changes

- 491a32d: Add useQueries capability

## 3.12.1

### Patch Changes

- e0164f6: Publish README

## 3.12.0

### Minor Changes

- 5a13803: Allow typed query parameters by encoding them as JSON strings (disabled by default)

### Patch Changes

- 36e5bd4: Fix typing for query

## 3.11.2

## 3.11.1

## 3.11.0

### Minor Changes

- 57acbad: Added the ability to omit the second parameter if there no required query parameters

## 3.10.2

### Patch Changes

- fd456fc: Fix CJS export, fixes @ts-rest/react-query 3.10.1

## 3.10.1

### Patch Changes

- 7f76c10: Fix missing typings due to new declaration file path

## 3.10.0

## 3.9.0

## 3.8.0

### Patch Changes

- 1b3faaf: Use z.input for body and query types for clients

## 3.7.0

## 3.6.1

### Patch Changes

- Update package.json exports to fix #66

## 3.6.0

### Minor Changes

- 6753c69: Build ESM and CommonJS for improved compatibility

## 3.5.0

### Minor Changes

- 068822d: Add support for multipart/form-data

## 3.4.2

### Patch Changes

- 242d795: Fix custom api not being used on useMutation

## 3.4.1

## 3.4.0

## 3.3.0

## 3.2.2

## 3.2.1

### Patch Changes

- 029de31: Fix missing typescript definitions

## 3.2.0

### Minor Changes

- c9a5a52: Add useInfiniteQuery support to @ts-rest/react-query
