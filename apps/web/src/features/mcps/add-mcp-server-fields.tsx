import { Plus, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { ArrayTokenInput } from './array-token-input.tsx';

export interface KeyValueRow {
  readonly key: string;
  readonly value: string;
}

export function Field({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-stone-400">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
  ariaLabel,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly type?: 'text' | 'url';
  readonly ariaLabel?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      aria-label={ariaLabel}
      className="w-full bg-stone-900 border-[0.5px] border-stone-800 rounded-md px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-orange-500/50"
    />
  );
}

export function TransportRadio({
  label,
  selected,
  onSelect,
}: {
  readonly label: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex-1 px-3 py-2 rounded-md text-sm border-[0.5px] transition-colors',
        selected
          ? 'border-orange-500/60 bg-orange-500/10 text-stone-100'
          : 'border-stone-800 bg-stone-900 text-stone-400 hover:text-stone-200',
      )}
    >
      {label}
    </button>
  );
}

export function StdioFields({
  command,
  onCommandChange,
  args,
  onArgsChange,
}: {
  readonly command: string;
  readonly onCommandChange: (value: string) => void;
  readonly args: readonly string[];
  readonly onArgsChange: (next: readonly string[]) => void;
}) {
  return (
    <>
      <Field label="Comando">
        <TextInput
          value={command}
          onChange={onCommandChange}
          placeholder="/usr/local/bin/mcp-server"
          required
        />
      </Field>
      <Field label="Argumentos">
        <ArrayTokenInput
          label="Argumento"
          values={args}
          onChange={onArgsChange}
          placeholder="--stdio"
        />
      </Field>
    </>
  );
}

export function HttpFields({
  url,
  onUrlChange,
  headers,
  onHeadersChange,
}: {
  readonly url: string;
  readonly onUrlChange: (value: string) => void;
  readonly headers: readonly KeyValueRow[];
  readonly onHeadersChange: (next: readonly KeyValueRow[]) => void;
}) {
  function updateAt(index: number, patch: Partial<KeyValueRow>) {
    onHeadersChange(headers.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }
  function removeAt(index: number) {
    onHeadersChange(headers.filter((_, i) => i !== index));
  }
  return (
    <>
      <Field label="URL">
        <TextInput
          value={url}
          onChange={onUrlChange}
          placeholder="https://mcp.example.com/sse"
          required
          type="url"
        />
      </Field>
      <Field label="Headers">
        <div className="space-y-2">
          {headers.map((row, index) => (
            <div key={index} className="flex gap-2">
              <TextInput
                value={row.key}
                onChange={(v) => updateAt(index, { key: v })}
                placeholder="Authorization"
                ariaLabel={`Nome do header ${index + 1}`}
              />
              <TextInput
                value={row.value}
                onChange={(v) => updateAt(index, { value: v })}
                placeholder="Bearer ..."
                ariaLabel={`Valor do header ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remover header"
                className="px-2 text-stone-500 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => onHeadersChange([...headers, { key: '', value: '' }])}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-200"
          >
            <Plus size={12} /> Adicionar header
          </button>
        </div>
      </Field>
    </>
  );
}
