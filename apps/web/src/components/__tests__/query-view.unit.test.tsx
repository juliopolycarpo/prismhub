import '../../../test-setup.ts';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'bun:test';
import { QueryView, type QueryViewQueryShape } from '../query-view.tsx';

afterEach(() => cleanup());

function makeQuery<T>(overrides: Partial<QueryViewQueryShape<T>> = {}): QueryViewQueryShape<T> {
  return { isLoading: false, isError: false, error: null, data: undefined, ...overrides };
}

describe('QueryView', () => {
  test('renders the default loading message when isLoading is true', () => {
    render(
      <QueryView query={makeQuery({ isLoading: true })} errorFallback="boom">
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(screen.getByText('Carregando…')).toBeDefined();
  });

  test('renders a custom loading message when provided', () => {
    render(
      <QueryView
        query={makeQuery({ isLoading: true })}
        loadingMessage="Carregando tools…"
        errorFallback="boom"
      >
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(screen.getByText('Carregando tools…')).toBeDefined();
  });

  test('renders the error message via getErrorMessage with fallback', () => {
    render(
      <QueryView
        query={makeQuery({ isError: true, error: new Error('network down') })}
        errorFallback="Falha ao carregar."
      >
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(screen.getByText('network down')).toBeDefined();
  });

  test('falls back to errorFallback when getErrorMessage produces an empty string', () => {
    render(
      <QueryView query={makeQuery({ isError: true, error: '' })} errorFallback="Falha ao carregar.">
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(screen.getByText('Falha ao carregar.')).toBeDefined();
  });

  test('renders emptyMessage when isEmpty(data) is true', () => {
    render(
      <QueryView
        query={makeQuery<readonly number[]>({ data: [] })}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage="Nada por aqui."
        errorFallback="Falha."
      >
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(screen.getByText('Nada por aqui.')).toBeDefined();
  });

  test('renders children(data) when data is present and not empty', () => {
    render(
      <QueryView
        query={makeQuery<readonly number[]>({ data: [1, 2, 3] })}
        isEmpty={(rows) => rows.length === 0}
        emptyMessage="empty"
        errorFallback="Falha."
      >
        {(rows) => <span>count {rows.length}</span>}
      </QueryView>,
    );

    expect(screen.getByText('count 3')).toBeDefined();
  });

  test('renders nothing when data is undefined and not loading or error', () => {
    const { container } = render(
      <QueryView query={makeQuery()} errorFallback="Falha.">
        {() => <span>content</span>}
      </QueryView>,
    );

    expect(container.textContent).toBe('');
  });
});
