import React from 'react';
import { ReactQueryProvider } from '../react-query-utils/react-query-provider';

export default function RootLayout({ children }: React.PropsWithChildren) {
  return <ReactQueryProvider>{children}</ReactQueryProvider>;
}
