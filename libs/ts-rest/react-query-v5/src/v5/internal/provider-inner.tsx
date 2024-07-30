'use client';

import { AppRouter, ClientArgs } from '@ts-rest/core';
import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { initQueryClient } from './create-hooks';
import { TsrQueryClientContext } from './use-tsr-query-client';

export function TsRestInnerProvider<
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>({
  children,
  contract,
  clientOptions,
}: React.PropsWithChildren<{
  contract: TContract;
  clientOptions: TClientArgs;
}>) {
  const queryClient = useQueryClient();
  const tsrQueryClient = useMemo(() => {
    return initQueryClient(contract, clientOptions, queryClient);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  return (
    <TsrQueryClientContext.Provider value={tsrQueryClient}>
      {children}
    </TsrQueryClientContext.Provider>
  );
}
