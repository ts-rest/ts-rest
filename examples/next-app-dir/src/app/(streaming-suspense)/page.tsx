import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { tsr } from '@/lib/react-query/tsr';
import { getQueryClientRsc } from '@/lib/react-query/get-query-client';
import { Posts } from '@/app/(streaming-suspense)/posts';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 5;

export default function Test() {
  const tsrQueryClient = tsr.initQueryClient(getQueryClientRsc(true));

  // no await here, so this will stream
  tsrQueryClient.getPosts.prefetchInfiniteQuery({
    queryKey: ['posts', ''],
    queryData: {
      query: {
        skip: 0,
        take: PAGE_SIZE,
      },
    },
    initialPageParam: { skip: 0, take: PAGE_SIZE },
  });

  return (
    <HydrationBoundary state={dehydrate(tsrQueryClient)}>
      <Suspense fallback={<div>Loading...</div>}>
        <Posts />
      </Suspense>
    </HydrationBoundary>
  );
}
