import '../pages/styles.css';

import React from 'react';
import { ReactQueryProvider } from './react-query-utils/react-query-provider';

export const metadata = {
  title: 'ts-rest example app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
