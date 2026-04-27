import type { ReactNode } from 'react';
import { getErrorMessage } from '../lib/error.ts';

export interface QueryViewQueryShape<T> {
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly error: unknown;
  readonly data: T | undefined;
}

export interface QueryViewProps<T> {
  readonly query: QueryViewQueryShape<T>;
  /**
   * Called only when `data` is defined. Return true to render `emptyMessage`
   * instead of `children(data)`. Defaults to `false` (never empty).
   */
  readonly isEmpty?: (data: T) => boolean;
  readonly loadingMessage?: string;
  readonly emptyMessage?: string;
  readonly errorFallback: string;
  readonly children: (data: T) => ReactNode;
}

const NEVER_EMPTY = (): boolean => false;

/**
 * Renders the standard four-state UI for a TanStack Query result:
 * loading -> error -> empty -> content.
 *
 * Callers own the surrounding layout; this component is purely a state switch.
 */
export function QueryView<T>({
  query,
  isEmpty = NEVER_EMPTY,
  loadingMessage = 'Carregando…',
  emptyMessage,
  errorFallback,
  children,
}: QueryViewProps<T>): ReactNode {
  if (query.isLoading) {
    return <p className="text-sm text-stone-500">{loadingMessage}</p>;
  }
  if (query.isError) {
    return <p className="text-sm text-red-400">{getErrorMessage(query.error, errorFallback)}</p>;
  }
  if (query.data === undefined) {
    return null;
  }
  if (emptyMessage !== undefined && isEmpty(query.data)) {
    return <p className="text-sm text-stone-500">{emptyMessage}</p>;
  }
  return children(query.data);
}
