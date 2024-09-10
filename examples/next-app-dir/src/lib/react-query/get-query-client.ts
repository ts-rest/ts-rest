import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from '@tanstack/react-query';
import { cache } from 'react';

function makeQueryClient(streamPendingQueries = false) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },

      ...(streamPendingQueries
        ? {
            dehydrate: {
              // include pending queries in dehydration
              shouldDehydrateQuery: (query) => {
                return (
                  defaultShouldDehydrateQuery(query) ||
                  query.state.status === 'pending'
                );
              },
            },
          }
        : {}),
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient(streamPendingQueries = false) {
  if (isServer) {
    // Server: always make a new query client
    return makeQueryClient(streamPendingQueries);
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient)
      browserQueryClient = makeQueryClient(streamPendingQueries);
    return browserQueryClient;
  }
}

export const getQueryClientRsc = cache(getQueryClient);
