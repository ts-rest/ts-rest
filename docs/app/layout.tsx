import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Banner } from 'fumadocs-ui/components/banner';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ts-rest',
  description: 'ts-rest is a library for building REST APIs with TypeScript.',
};

export default function Layout({ children }: { children: any }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Banner variant="rainbow" id="3-53-0-release">
          Zod 4 (and all other Standard Schema support) is available as a
          release candidate `3.53.0-rc.0`
        </Banner>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
