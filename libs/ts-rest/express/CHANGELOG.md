# @ts-rest/express

## 3.10.1

## 3.10.0

## 3.9.0

### Minor Changes

- 020a8c5: Allow optional [ts-rest] ... logging for express endpoints
- 020a8c5: Pass express errors to next() rather than catching them and handling with ts-rest

## 3.8.0

## 3.7.0

### Minor Changes

- d4d9be5: Add support for pathParams Zod verification

## 3.6.1

## 3.6.0

### Minor Changes

- 6753c69: Build ESM and CommonJS for improved compatibility

## 3.5.0

### Minor Changes

- 068822d: Add support for multipart/form-data

## 3.4.2

## 3.4.1

### Patch Changes

- 92346a0: Fix body not working without Zod schema

## 3.4.0

## 3.3.0

### Minor Changes

- bd619e4: Make createExpressEndpoints take IRouter instead of Express

## 3.2.2

### Patch Changes

- 09f8252: Expose request headers in express router

## 3.2.1

## 3.2.0

## 3.1.1

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
- 4792b26: Add error handling support to express
- c88fb99: Rename data to body to be more HTTP spec compliant

## 1.3.0

### Patch Changes

- 077d57b: Update client to have zod response type
- 5f87b1a: Add OpenAPI options for generateOpenApi

## 1.2.0

## 1.1.0

### Minor Changes

- 72dd65d: Extract express logic to @ts-rest/express
