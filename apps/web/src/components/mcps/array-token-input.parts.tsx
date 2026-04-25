import { Pencil, Trash2 } from 'lucide-react';
import { ApproveButton, TokenIconButton } from './array-token-buttons.tsx';
import { TokenInput } from './array-token-text-input.tsx';

export interface EditingToken {
  readonly index: number;
  readonly value: string;
}

interface TokenListProps {
  readonly label: string;
  readonly values: readonly string[];
  readonly editingToken: EditingToken | null;
  readonly onEdit: (next: EditingToken | null) => void;
  readonly onSave: () => void;
  readonly onEditingValueChange: (value: string) => void;
  readonly onRemove: (index: number) => void;
  readonly disabled: boolean;
}

interface TokenDraftInputProps {
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string | undefined;
  readonly onChange: (value: string) => void;
  readonly onApprove: () => void;
  readonly disabled: boolean;
}

export function TokenList({
  label,
  values,
  editingToken,
  onEdit,
  onSave,
  onEditingValueChange,
  onRemove,
  disabled,
}: TokenListProps) {
  return (
    <ul aria-label={`${label} aprovados`} className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <li key={`${value}-${index}`}>
          {editingToken?.index === index ? (
            <EditingChip
              label={`${label} ${index + 1}`}
              value={editingToken.value}
              onChange={onEditingValueChange}
              onSave={onSave}
              disabled={disabled}
            />
          ) : (
            <TokenChip
              label={`${label} ${index + 1}`}
              value={value}
              onEdit={() => onEdit({ index, value })}
              onRemove={() => onRemove(index)}
              disabled={disabled}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function TokenDraftInput({
  label,
  value,
  placeholder,
  onChange,
  onApprove,
  disabled,
}: TokenDraftInputProps) {
  return (
    <div className="flex gap-2">
      <TokenInput
        label={label}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        onEnter={onApprove}
        disabled={disabled}
      />
      <ApproveButton
        label={`Aprovar ${label}`}
        disabled={disabled || value.trim().length === 0}
        onClick={onApprove}
      />
    </div>
  );
}

function EditingChip({
  label,
  value,
  onChange,
  onSave,
  disabled,
}: {
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly onSave: () => void;
  readonly disabled: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-md border-[0.5px] border-stone-700 bg-stone-900 p-1">
      <TokenInput
        label={label}
        value={value}
        onChange={onChange}
        onEnter={onSave}
        disabled={disabled}
      />
      <ApproveButton
        label={`Salvar ${label}`}
        disabled={disabled || value.trim().length === 0}
        onClick={onSave}
      />
    </span>
  );
}

function TokenChip({
  label,
  value,
  onEdit,
  onRemove,
  disabled,
}: {
  readonly label: string;
  readonly value: string;
  readonly onEdit: () => void;
  readonly onRemove: () => void;
  readonly disabled: boolean;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-2 rounded-full border-[0.5px] border-stone-700 bg-stone-900/80 px-2 py-1">
      <span className="max-w-48 truncate font-mono text-xs text-stone-200">{value}</span>
      <TokenIconButton
        label={`Editar ${label}: ${value}`}
        onClick={onEdit}
        icon={<Pencil size={12} />}
        disabled={disabled}
      />
      <TokenIconButton
        label={`Excluir ${label}: ${value}`}
        onClick={onRemove}
        icon={<Trash2 size={12} />}
        danger
        disabled={disabled}
      />
    </span>
  );
}
