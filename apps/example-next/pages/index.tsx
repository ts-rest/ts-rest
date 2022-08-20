import { apiBlog } from '@ts-rest/example-contracts';
import { initQueryClient } from '@ts-rest/react-query';
import Link from 'next/link';
import { Layout } from '../components/Layout';

export const api = initQueryClient(apiBlog, {
  baseUrl: 'http://localhost:3334',
  baseHeaders: {},
});

export function Index() {
  const { data, isLoading } = api.getPosts.useQuery(['posts'], {
    query: { take: 5, skip: 0 },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {data?.data.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id}>
            <div className="card bg-base-100 shadow-xl w-full hover:scale-105 transition cursor-pointer">
              <div className="card-body">
                <div className="flex flex-row justify-between">
                  <h2 className="card-title">{post.title}</h2>
                  <div>
                    <div className="avatar placeholder">
                      <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                        <span className="text-xs">OB</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p>{post.description}?</p>
                <div className="card-actions justify-end">
                  {post.tags.map((tag) => (
                    <div key={tag} className="badge badge-outline">
                      Fashion
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <button className="btn mt-8">New Post</button>
    </Layout>
  );
}

export default Index;
