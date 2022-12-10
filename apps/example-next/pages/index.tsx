import { apiBlog } from '@ts-rest/example-contracts';
import { initQueryClient } from '@ts-rest/react-query';
import Link from 'next/link';
import classNames from 'classnames';

export const api = initQueryClient(apiBlog, {
  baseUrl: 'http://localhost:4200/api',
  baseHeaders: {},
});

export function Index() {
  const PAGE_SIZE = 5;

  const { isLoading, data, hasNextPage, fetchNextPage, isPaused } =
    api.getPosts.useInfiniteQuery(
      ['posts'],
      ({ pageParam = { skip: 0, take: PAGE_SIZE } }) => ({
        query: {
          skip: pageParam.skip,
          take: pageParam.take,
        },
      }),
      {
        getNextPageParam: (lastPage, allPages) =>
          lastPage.status === 200
            ? lastPage.body.count > allPages.length * PAGE_SIZE
              ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
              : undefined
            : undefined,
        networkMode: 'offlineFirst',
        staleTime: 1000 * 5,
      }
    );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No posts found</div>;
  }

  const posts = data.pages.flatMap((page) =>
    page.status === 200 ? page.body.posts : []
  );

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {posts.map((post) => (
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
      <button
        disabled={!hasNextPage}
        className={classNames('btn mt-6', { 'btn-disabled': !hasNextPage })}
        onClick={() => fetchNextPage()}
      >
        Load more
      </button>
    </div>
  );
}

export default Index;
