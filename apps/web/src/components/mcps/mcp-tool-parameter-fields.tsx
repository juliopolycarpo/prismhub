import { useState, type ComponentType } from 'react';
import { Toggle } from '../ui.tsx';
import { ArrayTokenInput } from './array-token-input.tsx';
import type { ParsedParameter } from './tool-parameters.ts';

interface FieldProps {
  readonly param: ParsedParameter;
  readonly inputId: string;
  readonly disabled: boolean;
}

export function ParameterControl({
  param,
  toolName,
  disabled = false,
}: {
  readonly param: ParsedParameter;
  readonly toolName: string;
  readonly disabled?: boolean;
}) {
  const inputId = `${toolName}-${param.name}`;
  const Field = FIELD_CONTROLS[param.control];
  if (!Field) {
    return <span className="text-xs text-stone-500">não editável</span>;
  }
  return <Field param={param} inputId={inputId} disabled={disabled} />;
}

const FIELD_CONTROLS: Record<string, ComponentType<FieldProps>> = {
  boolean: BooleanField,
  integer: NumericField,
  number: NumericField,
  enum: EnumField,
  string: StringField,
  array: ArrayField,
};

function BooleanField({ param, disabled }: FieldProps) {
  const initial = typeof param.defaultValue === 'boolean' ? param.defaultValue : false;
  const [value, setValue] = useState(initial);
  return (
    <div role="group" aria-label={param.name}>
      <Toggle isActive={value} disabled={disabled} onChange={() => setValue((v) => !v)} />
    </div>
  );
}

function NumericField({ param, inputId, disabled }: FieldProps) {
  const initial = typeof param.defaultValue === 'number' ? String(param.defaultValue) : '';
  const [value, setValue] = useState(initial);
  return (
    <input
      id={inputId}
      type="number"
      value={value}
      step={param.control === 'integer' ? 1 : 'any'}
      min={param.minimum ?? undefined}
      max={param.maximum ?? undefined}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      aria-label={param.name}
      className="w-full rounded-md border-[0.5px] border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-orange-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45 md:max-w-32"
    />
  );
}

function StringField({ param, inputId, disabled }: FieldProps) {
  const initial = typeof param.defaultValue === 'string' ? param.defaultValue : '';
  const [value, setValue] = useState(initial);
  return (
    <input
      id={inputId}
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      aria-label={param.name}
      className="w-full rounded-md border-[0.5px] border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-orange-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
    />
  );
}

function ArrayField({ param, disabled }: FieldProps) {
  const [values, setValues] = useState(() => toStringArray(param.defaultValue));
  return (
    <ArrayTokenInput
      label={param.name}
      values={values}
      onChange={setValues}
      inputLabel={param.name}
      placeholder="novo item"
      disabled={disabled}
    />
  );
}

function EnumField({ param, inputId, disabled }: FieldProps) {
  const options = param.enumOptions ?? [];
  const initial =
    typeof param.defaultValue === 'string' && options.includes(param.defaultValue)
      ? param.defaultValue
      : (options[0] ?? '');
  const [value, setValue] = useState(initial);
  return (
    <select
      id={inputId}
      value={value}
      disabled={disabled}
      onChange={(e) => setValue(e.target.value)}
      aria-label={param.name}
      className="w-full rounded-md border-[0.5px] border-stone-800 bg-stone-950 px-3 py-2 text-sm text-stone-200 focus:border-orange-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-45"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isStringablePrimitive).map(String);
}

function isStringablePrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}
