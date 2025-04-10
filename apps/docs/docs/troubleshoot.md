# Troubleshoot 
##  Why is my TypeScript intellisense *slow*? 

You'll need to enable `strict` in your `tsconfig.json`:
```json
  "compilerOptions": {
    ...
    "strict": true
  }
```
If you're using a monorepo, make sure this is applied at the `project` level. Example:

```
./apps/some-app/tsconfig.json
```
 ^ make sure `strict` is `true` here


If you cannot use `strict` entirely, you'll need to at least enable `strictNullChecks`. 

This is required as part of [Zod](https://github.com/colinhacks/zod#requirements). See why [here](https://github.com/colinhacks/zod/issues/1750).

Additionally, if you're using a monorepo, make sure the contract's package exports the built files and not the Typescript files:

```
  "exports": {
    "./*": {
      "types": "./dist/*.d.ts",
      "default": "./dist/*.js"
    }
  }
```
