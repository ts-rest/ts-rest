'use client';

import { useContext } from 'react';
import { SearchContext } from '@/lib/search-context';
import { usePathname, useRouter } from 'next/navigation';

export const SearchInput = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { searchString, setSearchString } = useContext(SearchContext);

  return (
    <div className="form-control">
      <input
        type="text"
        placeholder="Search"
        className="input input-bordered"
        value={searchString}
        onChange={(e) => {
          // if not on homepage, redirect to homepage
          if (pathname !== '/') {
            router.push('/');
          }

          setSearchString(e.target.value);
        }}
      />
    </div>
  );
};
