import type { HTMLInputTypeAttribute } from 'react';

interface FormFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type: HTMLInputTypeAttribute;
  readonly value: string;
  readonly error?: string | null;
  readonly required?: boolean;
  readonly onChange: (value: string) => void;
}

export function FormField({
  id,
  label,
  type,
  value,
  error,
  required = true,
  onChange,
}: FormFieldProps) {
  return (
    <label htmlFor={id} className="block text-xs text-stone-400 space-y-1">
      <span>{label}</span>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="w-full rounded-md border-[0.5px] border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none focus:border-orange-500/60"
      />
      {error ? <span className="block text-red-400">{error}</span> : null}
    </label>
  );
}
