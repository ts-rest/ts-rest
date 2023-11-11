---
'@ts-rest/core': patch
'@ts-rest/express': patch
'@ts-rest/fastify': patch
'@ts-rest/nest': patch
'@ts-rest/next': patch
'@ts-rest/open-api': patch
'@ts-rest/react-query': patch
'@ts-rest/solid-query': patch
'@ts-rest/vue-query': patch
---

- `@ts-rest/fastify` fix: fastify deprecated routerPath property (fixes [#392](https://github.com/ts-rest/ts-rest/issues/392))
- `@ts-rest/open-api` fix: Pass through contentType to OpenApi schema ([#414](https://github.com/ts-rest/ts-rest/pull/414))
- `@ts-rest/core` fix: Content-type text/html returns blob body (fixes [#418](https://github.com/ts-rest/ts-rest/issues/418))
