import { Layout } from '../../components/Layout';
import { useRouter } from 'next/router';
import { api } from '..';

export function Index() {
  const router = useRouter();

  const postId = router.query.id as string;

  const { data, error, isLoading } = api.getPost.useQuery([`post-${postId}`], {
    params: { id: postId },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      {data?.data ? (
        <div className="prose">
          <h1>{data.data.title}</h1>
          <p>{data.data.description}</p>

          <div>{data.data.content}</div>
        </div>
      ) : null}
    </Layout>
  );
}

export default Index;
