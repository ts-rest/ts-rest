import React from 'react';
import { ReactQueryStreamingProvider } from '@/lib/react-query/react-query-streaming-provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return <ReactQueryStreamingProvider>{children}</ReactQueryStreamingProvider>;
}
