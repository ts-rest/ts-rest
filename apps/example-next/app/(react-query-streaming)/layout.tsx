import React from 'react';
import { ReactQueryStreamingProvider } from '../react-query-utils/react-query-streaming-provider';

export default function Layout({ children }: React.PropsWithChildren) {
  return <ReactQueryStreamingProvider>{children}</ReactQueryStreamingProvider>;
}
