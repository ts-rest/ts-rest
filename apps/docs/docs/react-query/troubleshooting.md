# Troubleshooting

## `No QueryClient set, use QueryClientProvider to set one`

If you see this error despite having set a `QueryClient` using `QueryClientProvider`. Then you might have different versions of `@tanstack/react-query` installed in your project.

This can also happen in rare cases when ESM and CJS versions of the package are mixed by a bundler like Webpack.

If you have made sure that you are using the same version of `@tanstack/react-query` across your project, and are still having problems, you can work around this
by importing `@tanstack/react-query` from `@ts-rest/react-query/tanstack` instead of `@tanstack/react-query`. This will ensure that you are using the same version as the one used
by `@ts-rest/react-query`.

```tsx
import { QueryClient, QueryClientProvider } from '@ts-rest/react-query/tanstack';

const queryClient = new QueryClient()

function App() {
  return <QueryClientProvider client={queryClient}>...</QueryClientProvider>
}
```

:::info

The import path is `@ts-rest/react-query/tanstack` and not `@ts-rest/react-query/v5/tanstack`. `@ts-rest/react-query/tanstack` simply re-exports whichever version of `@tanstack/react-query` you have installed.

:::
