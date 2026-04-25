import '../../../test-setup.ts';
import { cleanup, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, test } from 'bun:test';
import { useState } from 'react';
import { ArrayTokenInput } from './array-token-input.tsx';
import { expectInputValue } from './test-assertions.ts';

afterEach(() => cleanup());

function ArrayTokenHarness({ initialValues = [] }: { readonly initialValues?: readonly string[] }) {
  const [values, setValues] = useState(initialValues);
  return (
    <ArrayTokenInput
      label="URL"
      inputLabel="urls"
      values={values}
      onChange={setValues}
      placeholder="novo item"
    />
  );
}

describe('ArrayTokenInput', () => {
  test('approves draft value into token and clears input', async () => {
    const user = userEvent.setup();
    render(<ArrayTokenHarness />);

    await user.type(within(document.body).getByLabelText('urls'), 'https://exa.ai/docs');
    await user.click(within(document.body).getByRole('button', { name: 'Aprovar urls' }));

    expect(within(document.body).getByText('https://exa.ai/docs'));
    expectInputValue(within(document.body).getByLabelText('urls'), '');
  });

  test('edits and deletes approved tokens', async () => {
    const user = userEvent.setup();
    render(<ArrayTokenHarness initialValues={['https://old.example/docs']} />);

    await user.click(
      within(document.body).getByRole('button', {
        name: 'Editar URL 1: https://old.example/docs',
      }),
    );
    await user.clear(within(document.body).getByLabelText('URL 1'));
    await user.type(within(document.body).getByLabelText('URL 1'), 'https://new.example/docs');
    await user.click(within(document.body).getByRole('button', { name: 'Salvar URL 1' }));

    expect(within(document.body).getByText('https://new.example/docs'));
    await user.click(
      within(document.body).getByRole('button', {
        name: 'Excluir URL 1: https://new.example/docs',
      }),
    );
    expect(within(document.body).queryByText('https://new.example/docs')).toBeNull();
  });
});
