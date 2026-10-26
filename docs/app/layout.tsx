import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { Banner } from 'fumadocs-ui/components/banner';
import { PostHogProvider } from '../components/PostHogProvider';
import { CookieBanner } from '../components/CookieBanner';

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
        <PostHogProvider>
          <Banner id="maintenance-ended">
            <span>
              ts-rest is no longer maintained. Forks are welcome.{' '}
              <a
                href="/#maintenance-status"
                className="underline underline-offset-4"
              >
                Read the notice.
              </a>
            </span>
          </Banner>
          <RootProvider>{children}</RootProvider>
          <CookieBanner />
        </PostHogProvider>
      </body>
    </html>
  );
}
