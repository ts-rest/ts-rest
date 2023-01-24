---
'@ts-rest/nest': minor
'@ts-rest/core': patch
---

Rename some Nest functions and types, and deprecate old names

Fix Nest deprecation warning when passing Zod error to HttpException (#122)

Some internal helper types (`NestControllerShapeFromAppRouter` and `NestAppRouteShape`) that were previously exported are now kept internal.
You can use `NestControllerInterface` and `NestRequestShapes` instead.
