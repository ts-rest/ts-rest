import { QueryClient } from '@tanstack/query-core';
import { cache } from 'react';

export const getQueryClient = cache(() => new QueryClient());
