'use client';

import { edgeApi } from '../react-query-utils/api-client';

export function ClientComponent() {
  const { isLoading, isError, data } = edgeApi.test.useQuery(
    ['TEST'],
    {
      params: { id: 1 },
      query: { foo: 'test', bar: 123 },
    },
    {
      staleTime: 5000,
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  return (
    <main className="grid min-h-full place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <ul role="list" className="divide-y divide-gray-100 w-80">
        <li className="flex gap-x-4 py-5">
          <div className="flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm font-semibold leading-6 text-gray-900">
                ID
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
              {data.body.id}
            </p>
          </div>
        </li>
        <li className="flex gap-x-4 py-5">
          <div className="flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm font-semibold leading-6 text-gray-900">
                Foo
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
              {data.body.foo}
            </p>
          </div>
        </li>
        <li className="flex gap-x-4 py-5">
          <div className="flex-auto">
            <div className="flex items-baseline justify-between gap-x-4">
              <p className="text-sm font-semibold leading-6 text-gray-900">
                Bar
              </p>
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-gray-600">
              {data.body.bar}
            </p>
          </div>
        </li>
      </ul>
    </main>
  );
}
