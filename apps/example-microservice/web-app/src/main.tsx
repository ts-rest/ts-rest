import React from 'react';
import { App } from './App';
import { createRoot } from 'react-dom/client';
import { initQueryClient } from '@ts-rest/react-query';
import { postsApi } from '@ts-rest/example-microservice/util-posts-api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const postsClient = initQueryClient(postsApi, {
  baseHeaders: {},
  baseUrl: 'http://localhost:5003',
});

export const queryClient = new QueryClient();

const Wrappers = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
};

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(<Wrappers />);
