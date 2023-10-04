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

 - fix: address `zod` [CVE](https://nvd.nist.gov/vuln/detail/CVE-2023-4316) with bump `@ts-rest` peer dependency `zod` to minimum `^3.22.3`
