import { router } from './test-fixtures';
import { initQueryClient } from './ts-rest-client';
import { renderHook } from '@testing-library/react-hooks';
import { waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

const api = jest.fn();

const client = initQueryClient(router, {
  baseUrl: 'http://api.com',
  baseHeaders: {},
  api,
});

let queryClient = new QueryClient();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const SUCCESS_RESPONSE = {
  status: 200,
  body: {
    posts: [],
  },
};

const ERROR_RESPONSE = {
  status: 500,
  body: null,
};

describe('react-query', () => {
  beforeEach(() => {
    queryClient = new QueryClient();
    api.mockReset();
  });

  it('useQuery should handle success', async () => {
    api.mockResolvedValue(SUCCESS_RESPONSE);

    const { result } = renderHook(
      () => client.health.useQuery(['health'], {}),
      { wrapper }
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/health',
      body: undefined,
      headers: {},
    });

    await waitFor(() => {
      expect(result.current.isLoading).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(SUCCESS_RESPONSE);
  });

  it('useQuery should handle failure', async () => {
    api.mockResolvedValue(ERROR_RESPONSE);

    const { result } = renderHook(
      () => client.health.useQuery(['health'], {}, { retry: () => false }),
      { wrapper }
    );

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.isLoading).toStrictEqual(true);

    expect(api).toHaveBeenCalledWith({
      method: 'GET',
      path: 'http://api.com/health',
      body: undefined,
      headers: {},
    });

    await waitFor(() => {
      expect(result.current.isLoading).toStrictEqual(false);
    });

    expect(result.current.data).toStrictEqual(undefined);

    expect(result.current.error).toStrictEqual(ERROR_RESPONSE);
  });
});
