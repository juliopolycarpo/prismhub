import { cn } from '../../lib/cn.ts';

export interface SegmentedControlOption<TValue extends string> {
  readonly value: TValue;
  readonly label: string;
}

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  className,
  value,
  options,
  onChange,
}: {
  readonly ariaLabel: string;
  readonly className?: string;
  readonly value: TValue;
  readonly options: readonly SegmentedControlOption<TValue>[];
  readonly onChange: (next: TValue) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('flex rounded-lg border-[0.5px] border-stone-800 bg-stone-950 p-1', className)}
    >
      {options.map((option) => (
        <SegmentedControlButton
          key={option.value}
          option={option}
          selected={value === option.value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}

function SegmentedControlButton({
  option,
  selected,
  onSelect,
}: {
  readonly option: SegmentedControlOption<string>;
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
        'min-h-8 rounded-md px-3 py-1.5 text-sm transition-colors',
        selected ? 'bg-orange-500 text-white shadow-sm' : 'text-stone-400 hover:text-stone-200',
      )}
    >
      {option.label}
    </button>
  );
}
