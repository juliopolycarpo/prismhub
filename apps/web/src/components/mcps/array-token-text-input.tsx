import type { KeyboardEvent } from 'react';

export function TokenInput({
  label,
  value,
  placeholder,
  onChange,
  onEnter,
  disabled,
}: {
  readonly label: string;
  readonly value: string;
  readonly placeholder?: string | undefined;
  readonly onChange: (value: string) => void;
  readonly onEnter: () => void;
  readonly disabled: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={label}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => approveOnEnter(event, onEnter)}
      className="min-w-0 flex-1 rounded-md border-[0.5px] border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600 focus:border-orange-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
    />
  );
}

function approveOnEnter(event: KeyboardEvent<HTMLInputElement>, onEnter: () => void) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  onEnter();
}
