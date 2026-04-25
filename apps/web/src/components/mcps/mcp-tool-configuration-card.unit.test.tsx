import '../../../test-setup.ts';
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'bun:test';
import { McpToolConfigurationCard } from './mcp-tool-configuration-card.tsx';

afterEach(() => cleanup());

const SEARCH_TOOL = {
  name: 'web_search_exa',
  description: 'Search the web.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: { type: 'string' as const, description: 'Natural language query.' },
      numResults: { type: 'number' as const, default: 10 },
    },
    required: ['query'],
  },
};

describe('McpToolConfigurationCard', () => {
  test('disables parameter fields when agent decides input', async () => {
    const user = userEvent.setup();
    render(<McpToolConfigurationCard tool={SEARCH_TOOL} />);

    const queryInput = within(document.body).getByLabelText('query');
    expectInputDisabled(queryInput, false);

    await user.click(within(document.body).getByRole('radio', { name: 'Deixar o Agente decidir' }));

    expectInputDisabled(queryInput, true);
    expectInputDisabled(within(document.body).getByLabelText('numResults'), true);
  });
});

function expectInputDisabled(input: HTMLElement, expected: boolean) {
  if (!(input instanceof HTMLInputElement)) {
    throw new TypeError(`Expected input element, got ${input.tagName}`);
  }
  expect(input.disabled).toBe(expected);
}
