import React from 'react';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const tsr = initTsrReactQuery(postsApi, {
  baseUrl: 'http://localhost:5003',
  baseHeaders: {},
});

export const queryClient = new QueryClient();

const Wrappers = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>
        <App />
        <ReactQueryDevtools />
      </tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
};

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<Wrappers />);
