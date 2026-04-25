import '../../../test-setup.ts';
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'bun:test';
import { ParameterControl } from './mcp-tool-parameter-fields.tsx';
import { expectInputValue } from './test-assertions.ts';
import type { ParsedParameter } from './tool-parameters.ts';

afterEach(() => cleanup());

const URLS_PARAMETER: ParsedParameter = {
  name: 'urls',
  control: 'array',
  required: true,
  description: 'URLs to read.',
  defaultValue: ['https://docs.example/start'],
  enumOptions: null,
  minimum: null,
  maximum: null,
};

describe('ParameterControl', () => {
  test('renders array defaults as editable tokens with an empty draft input', async () => {
    const user = userEvent.setup();
    render(<ParameterControl param={URLS_PARAMETER} toolName="web_fetch_exa" />);

    expect(within(document.body).getByText('https://docs.example/start')).toBeTruthy();
    await user.type(within(document.body).getByLabelText('urls'), 'https://docs.example/api');
    await user.click(within(document.body).getByRole('button', { name: 'Aprovar urls' }));

    expect(within(document.body).getByText('https://docs.example/api')).toBeTruthy();
    expectInputValue(within(document.body).getByLabelText('urls'), '');
  });
});
