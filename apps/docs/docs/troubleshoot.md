# Troubleshoot 
##  Why is my Typescript intellisense *slow*? 

You'll need to enable `strictNullChecks` in your `tsconfig.json`:
```json
  "compilerOptions": {
    ...
    "strictNullChecks": true
  }
```
If you're using a monorepo, make sure this is applied at the `project` level. Example:

```
./apps/some-app/tsconfig.json
```
 ^ make sure `strictNullChecks` is `true` here


This is required as part of [Zod](https://github.com/colinhacks/zod#requirements). 

See why [here](https://github.com/colinhacks/zod/issues/1750)

