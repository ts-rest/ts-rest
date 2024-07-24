import '../pages/styles.css';

import React from 'react';

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
      <body>{children}</body>
    </html>
  );
}
