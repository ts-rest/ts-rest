/* @refresh reload */
import { render } from 'solid-js/web';
import { QueryClientProvider } from '@tanstack/solid-query';
import { QueryClient } from '@tanstack/solid-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

render(
  () => (
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  ),
  document.getElementById('root') as HTMLElement
);
