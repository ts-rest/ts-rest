'use client';

import classNames from 'classnames';
import Link from 'next/link';
import { tsr } from '@/lib/react-query/tsr';
import { SearchContext } from '@/lib/search-context';
import { useContext } from 'react';

const PAGE_SIZE = 5;

export function Posts() {
  const { searchString } = useContext(SearchContext);
  const { data, hasNextPage, fetchNextPage } =
    tsr.getPosts.useSuspenseInfiniteQuery({
      queryKey: ['posts', searchString],
      queryData: ({ pageParam }) => ({
        query: {
          skip: pageParam.skip,
          take: pageParam.take,
          ...(searchString && { search: searchString }),
        },
      }),
      initialPageParam: { skip: 0, take: PAGE_SIZE },
      getNextPageParam: (lastPage, allPages) =>
        lastPage.body.count > allPages.length * PAGE_SIZE
          ? { take: PAGE_SIZE, skip: allPages.length * PAGE_SIZE }
          : undefined,
    });

  const posts = data.pages.flatMap((page) =>
    page.status === 200 ? page.body.posts : []
  );

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {posts.map((post) => (
          <Link href={`/post/${post.id}`} key={post.id} prefetch={false}>
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
                <p>{post.description}</p>
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
