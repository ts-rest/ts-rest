import { AppRouter, ClientArgs } from '@ts-rest/core';
import { QueryClient } from '@tanstack/react-query';
import * as React from 'react';
import { useTsrQueryClient } from './internal/use-tsr-query-client';
import { initHooksContainer, initQueryClient } from './internal/create-hooks';
import { TsRestInnerProvider } from './internal/provider-inner';

export const initTsrReactQuery = <
  TContract extends AppRouter,
  TClientArgs extends ClientArgs,
>(
  contract: TContract,
  clientOptions: TClientArgs,
) => {
  return {
    ReactQueryProvider: function ({ children }: React.PropsWithChildren) {
      return (
        <TsRestInnerProvider contract={contract} clientOptions={clientOptions}>
          {children}
        </TsRestInnerProvider>
      );
    },
    ...initHooksContainer(contract, clientOptions),
    useQueryClient: useTsrQueryClient<TContract, TClientArgs>,
    initQueryClient: (queryClient: QueryClient) => {
      return initQueryClient(contract, clientOptions, queryClient);
    },
  };
};
