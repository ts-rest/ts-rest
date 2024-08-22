'use client';

import { createContext, useState } from 'react';

export const SearchContext = createContext<{
  searchString: string;
  setSearchString: (searchString: string) => void;
}>(null!);

export function SearchProvider({ children }: React.PropsWithChildren) {
  const [searchString, setSearchString] = useState('');

  return (
    <SearchContext.Provider value={{ searchString, setSearchString }}>
      {children}
    </SearchContext.Provider>
  );
}
