import { dehydrate } from '@tanstack/query-core';
import { getQueryClient } from '../react-query-utils/get-query-client';
import { Hydrate } from '../react-query-utils/hydrate.client';
import { edgeApi } from '../react-query-utils/api-client';
import { ClientComponent } from './client-component';

export default async function Test() {
  const client = getQueryClient();
  await edgeApi.test.prefetchQuery(
    client,
    ['TEST'],
    {
      params: { id: 1 },
      query: { foo: 'test', bar: 123 },
    },
    {
      staleTime: 5000,
    },
  );
  const dehydratedState = dehydrate(client);

  return (
    <main>
      <Hydrate state={dehydratedState}>
        <ClientComponent />
      </Hydrate>
    </main>
  );
}
