import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createAppQueryClient } from './lib/query-client.ts';

interface RenderWithQueryClientResult extends RenderResult {
  readonly queryClient: QueryClient;
}

export function renderWithQueryClient(
  ui: ReactElement,
  queryClient = createAppQueryClient(),
): RenderWithQueryClientResult {
  const view = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { ...view, queryClient };
}
