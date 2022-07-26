import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppProps } from 'next/app';
import Head from 'next/head';
import './styles.css';

export const queryClient = new QueryClient();

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Welcome to example-next!</title>
      </Head>
      <QueryClientProvider client={queryClient}>
        <main className="app">
          <Component {...pageProps} />
        </main>
      </QueryClientProvider>
    </>
  );
}

export default CustomApp;
