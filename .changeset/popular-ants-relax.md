---
'@ts-rest/core': patch
'@ts-rest/vue-query': patch
---

fix: content-type application/json will not be automatically included in client request if the route is GET or body is undefined/null
