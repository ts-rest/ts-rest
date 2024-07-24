'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { tsr } from './tsr';
import { getQueryClient } from './get-query-client';
import React from 'react';

export function ReactQueryStreamingProvider({
  children,
}: React.PropsWithChildren) {
  const queryClient = getQueryClient(true);

  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>{children}</tsr.ReactQueryProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
