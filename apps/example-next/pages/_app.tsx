import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';
import { Layout } from '../components/Layout';
import { tsr } from '../pages-tsr';

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
          <ReactQueryDevtools initialIsOpen={false} />
          <Toaster />
        </tsr.ReactQueryProvider>
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;
