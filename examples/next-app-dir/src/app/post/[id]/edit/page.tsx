import { tsr } from '@/lib/react-query/tsr';
import { Edit } from '@/app/post/[id]/edit/edit';
import { getQueryClientRsc } from '@/lib/react-query/get-query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

export default async function EditPage({ params }: { params: { id: string } }) {
  const tsrQueryClient = tsr.initQueryClient(getQueryClientRsc());

  await tsrQueryClient.getPost.prefetchQuery({
    queryKey: ['post', params.id],
    queryData: {
      params: { id: params.id },
    },
  });

  return (
    <HydrationBoundary state={dehydrate(tsrQueryClient)}>
      <Edit postId={params.id} />
    </HydrationBoundary>
  );
}
