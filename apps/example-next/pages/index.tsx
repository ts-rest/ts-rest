import classNames from 'classnames';
import Link from 'next/link';
import { tsr } from '../pages-tsr';

const PAGE_SIZE = 5;

export function Index() {
  const { isPending, isError, data, hasNextPage, fetchNextPage } =
    tsr.getPosts.useInfiniteQuery({
      queryKey: ['posts'],
      queryData: ({ pageParam }) => ({
        query: {
          skip: pageParam.skip.toString(),
          take: pageParam.take.toString(),
        },
      }),
      initialPageParam: { skip: 0, take: PAGE_SIZE },
      getNextPageParam: (lastPage, allPages) =>
        lastPage.body.count > allPages.length * PAGE_SIZE
          ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
          : undefined,
      networkMode: 'offlineFirst',
      staleTime: 1000 * 5,
      initialData: {
        pageParams: [{ skip: 0, take: PAGE_SIZE }],
        pages: [
          {
            status: 200,
            body: { posts: [], count: 0, skip: 0, take: PAGE_SIZE },
            headers: new Headers(),
          },
        ],
      },
    });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error!</div>;
  }

  const posts = data.pages.flatMap((page) =>
    page.status === 200 ? page.body.posts : [],
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
