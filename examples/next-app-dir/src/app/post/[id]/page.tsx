import { Post } from '@/app/post/post';
import { tsr } from '@/lib/react-query/tsr';
import { getQueryClientRsc } from '@/lib/react-query/get-query-client';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function PostPage({ params }: { params: { id: string } }) {
  const tsrQueryClient = tsr.initQueryClient(getQueryClientRsc());

  await tsrQueryClient.getPost.prefetchQuery({
    queryKey: ['post', params.id],
    queryData: {
      params: { id: params.id },
    },
  });

  return (
    <HydrationBoundary state={dehydrate(tsrQueryClient)}>
      <Post postId={params.id} />
    </HydrationBoundary>
  );
}
