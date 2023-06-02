---
"@ts-rest/core": minor
"@ts-rest/express": minor
"@ts-rest/nest": minor
"@ts-rest/next": minor
---

Implement strict mode at a contract level. Strict mode ensures that only known responses are allowed by the type system. This applies both on the server and client side. Enable this with `strictStatusCodes: true` when defining a contract.

If you would like to have the vanilla client throw an error when the response status is not known then you will need to use `throwOnUnknownStatus` when initializing the client.
