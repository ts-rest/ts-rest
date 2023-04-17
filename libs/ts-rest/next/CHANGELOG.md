# @ts-rest/next

## 3.19.2

### Patch Changes

- 96ab6bd: Revert ESM fix, due to failed compilation on Next.js

## 3.19.1

### Patch Changes

- ecac73d: Fix compatibility with Node.js TS native ESM code

## 3.19.0

## 3.18.1

## 3.18.0

## 3.17.0

## 3.16.2

## 3.16.1

## 3.16.0

### Minor Changes

- e490cf3: - Added server-side response validation feature
- Deprecated `@Api` decorator, use `@TsRest` instead

## 3.15.0

## 3.14.0

## 3.13.1

### Patch Changes

- d778e60: Rebuilt without code comments in the compiled JS

## 3.13.0

## 3.12.1

### Patch Changes

- e0164f6: Publish README

## 3.12.0

### Minor Changes

- 5a13803: Allow typed query parameters by encoding them as JSON strings (disabled by default)

## 3.11.2

## 3.11.1

## 3.11.0

## 3.10.2

## 3.10.1

## 3.10.0

### Patch Changes

- 35c64db: Move next lib utils out of @ts-rest/core to reduce bundle size

## 3.9.0

## 3.8.0

## 3.7.0

### Minor Changes

- 8a19717: Add pathParams transformations

## 3.6.1

## 3.6.0

### Minor Changes

- 6753c69: Build ESM and CommonJS for improved compatibility

## 3.5.0

## 3.4.2

## 3.4.1

## 3.4.0

## 3.3.0

## 3.2.2

## 3.2.1

## 3.2.0

## 3.1.1

## 3.1.0

### Minor Changes

- 1696c44: Provide access to req and res from Next.js adapter

## 3.0.0

### Major Changes

- 895112a: Migrate paths to a string rather than function

## 2.1.0

### Minor Changes

- 75f157a: Add Zod validation to @ts-rest/next
- a80cc0f: Add initial Next implementation, with a single endpoint based implementation
