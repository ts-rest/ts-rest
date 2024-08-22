import React from 'react';
import { ReactQueryProvider } from '@/lib/react-query/react-query-provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
