import { dehydrate } from '@tanstack/query-core';
import { HydrationBoundary } from '@tanstack/react-query';
import { tsr } from '../../react-query-utils/tsr';
import { getQueryClientRsc } from '../../react-query-utils/get-query-client';
import { ClientComponent } from './client-component';

export default async function Test() {
  const tsrQueryClient = tsr.initQueryClient(getQueryClientRsc());

  await tsrQueryClient.test.prefetchQuery({
    queryKey: ['TEST'],
    queryData: {
      params: { id: 1 },
      query: { foo: 'test', bar: 123 },
    },
  });

  return (
    <main>
      <HydrationBoundary state={dehydrate(tsrQueryClient)}>
        <ClientComponent />
      </HydrationBoundary>
    </main>
  );
}
