import { useState } from 'react';
import { cn } from '../../lib/cn.ts';
import { TokenDraftInput, TokenList, type EditingToken } from './array-token-input.parts.tsx';

interface ArrayTokenInputProps {
  readonly label: string;
  readonly values: readonly string[];
  readonly onChange: (next: readonly string[]) => void;
  readonly placeholder?: string;
  readonly inputLabel?: string;
  readonly className?: string;
  readonly disabled?: boolean;
}

/**
 * Turns free-form array entries into approved, editable tokens.
 * @example <ArrayTokenInput label="Argument" values={args} onChange={setArgs} />
 */
export function ArrayTokenInput({
  label,
  values,
  onChange,
  placeholder,
  inputLabel,
  className,
  disabled = false,
}: ArrayTokenInputProps) {
  const [draftValue, setDraftValue] = useState('');
  const [editingToken, setEditingToken] = useState<EditingToken | null>(null);
  const draftLabel = inputLabel ?? `${label} ${values.length + 1}`;

  function approveDraft() {
    const approvedValue = draftValue.trim();
    if (approvedValue.length === 0) return;
    onChange([...values, approvedValue]);
    setDraftValue('');
  }

  function approveEditingToken() {
    if (!editingToken || editingToken.value.trim().length === 0) return;
    updateValueAt(editingToken.index, editingToken.value.trim(), values, onChange);
    setEditingToken(null);
  }

  return (
    <div className={cn('space-y-2', className)}>
      {values.length > 0 && (
        <TokenList
          label={label}
          values={values}
          editingToken={editingToken}
          onEdit={setEditingToken}
          onSave={approveEditingToken}
          onEditingValueChange={(value) => updateEditingValue(value, editingToken, setEditingToken)}
          onRemove={(index) => removeValueAt(index, values, onChange)}
          disabled={disabled}
        />
      )}
      <TokenDraftInput
        label={draftLabel}
        value={draftValue}
        placeholder={placeholder}
        onChange={setDraftValue}
        onApprove={approveDraft}
        disabled={disabled}
      />
    </div>
  );
}

function updateEditingValue(
  value: string,
  editingToken: EditingToken | null,
  onEdit: (next: EditingToken | null) => void,
) {
  if (!editingToken) return;
  onEdit({ index: editingToken.index, value });
}

function updateValueAt(
  indexToUpdate: number,
  nextValue: string,
  values: readonly string[],
  onChange: (next: readonly string[]) => void,
) {
  onChange(values.map((value, index) => (index === indexToUpdate ? nextValue : value)));
}

function removeValueAt(
  indexToRemove: number,
  values: readonly string[],
  onChange: (next: readonly string[]) => void,
) {
  onChange(values.filter((_, index) => index !== indexToRemove));
}
