'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { tsr } from './tsr';
import { getQueryClient } from './get-query-client';

export function ReactQueryProvider({ children }: React.PropsWithChildren) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <tsr.ReactQueryProvider>{children}</tsr.ReactQueryProvider>
    </QueryClientProvider>
  );
}
