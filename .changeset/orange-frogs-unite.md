---
'@ts-rest/serverless': patch
---

Refactor utils to not use `FileReader` allowing `createLambdaHandler` to run in AWS Lambda node environments.
