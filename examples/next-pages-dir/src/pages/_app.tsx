import './styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { tsr } from '@/lib/tsr';

export const queryClient = new QueryClient();

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to example-next!</title>
      </Head>
      <QueryClientProvider client={queryClient}>
        <tsr.ReactQueryProvider>
          <main className="app">
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </main>
          <Toaster />
        </tsr.ReactQueryProvider>
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;
