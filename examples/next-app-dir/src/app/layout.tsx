import './globals.css';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { Navbar } from './components/navbar';
import { SearchProvider } from '@/lib/search-context';

export const metadata = {
  title: 'ts-rest example app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="emerald">
      <body>
        <main className="app">
          <div className="flex flex-col min-h-screen container mx-auto">
            <SearchProvider>
              <Navbar />
              <div className="grow mt-6">{children}</div>
            </SearchProvider>
          </div>
        </main>
        <Toaster />
      </body>
    </html>
  );
}
