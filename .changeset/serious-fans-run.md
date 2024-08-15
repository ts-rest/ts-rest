---
'@ts-rest/serverless': minor
---

Revert breaking change from v3.47.0. Order of generics on `tsr.router` and `tsr.route` have been reverted. `tsr.routerWithMiddleware` has been introduced so the contract does need to be passed twice.
