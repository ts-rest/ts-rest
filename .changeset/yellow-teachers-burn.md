---
'@ts-rest/react-query': minor
---

RECOMMENDED: Add `includeThrownErrorsInErrorType` in react query client options. This should include the `Error` exception in the `error` type to cover non-HTTP errors such as network or CORS errors. Disabled by default so it does not break existing code, but extremely recommended to switch on.
