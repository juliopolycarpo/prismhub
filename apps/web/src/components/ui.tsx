import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn.ts';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
}

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-orange-500 text-white hover:bg-orange-600',
  secondary: 'bg-stone-800 text-stone-200 hover:bg-stone-700',
  outline: 'border-[0.5px] border-stone-800 bg-transparent hover:bg-stone-800 text-stone-300',
  ghost: 'hover:bg-stone-800/50 text-stone-400 hover:text-stone-200',
  danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-9 px-4 py-2 text-sm',
  lg: 'h-10 px-8 text-sm',
  icon: 'h-9 w-9',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500 disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

type BadgeVariant = 'default' | 'success' | 'warning';

const BADGE_VARIANT: Record<BadgeVariant, string> = {
  default: 'border-stone-800 text-stone-300 bg-stone-800/30',
  success: 'border-green-500/20 text-green-400 bg-green-500/10',
  warning: 'border-orange-500/20 text-orange-400 bg-orange-500/10',
};

export function Badge({
  children,
  className,
  variant = 'default',
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly variant?: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border-[0.5px] px-2.5 py-0.5 text-xs font-semibold transition-colors',
        BADGE_VARIANT[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border-[0.5px] border-stone-800 bg-stone-900', className)}
      {...props}
    >
      {children}
    </div>
  );
}

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

function SegmentedControlButton<TValue extends string>({
  option,
  selected,
  onSelect,
}: {
  readonly option: SegmentedControlOption<TValue>;
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

interface FormFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type: string;
  readonly value: string;
  readonly error?: string | null;
  readonly required?: boolean;
  onChange(value: string): void;
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
        className="mt-1 w-full rounded-md border-[0.5px] border-stone-800 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none focus:border-orange-500/60"
      />
      {error ? <span className="block text-red-400">{error}</span> : null}
    </label>
  );
}

export function StatCard({
  headline,
  label,
  hint,
  className,
}: {
  readonly headline: string;
  readonly label: string;
  readonly hint?: string;
  readonly className?: string;
}) {
  return (
    <Card className={cn('p-5 bg-stone-900/50', className)}>
      <h3 className="text-2xl font-semibold text-stone-200">{headline}</h3>
      <p className="text-xs text-stone-500 mt-1">{label}</p>
      {hint && <p className="text-xs text-stone-600 mt-1">{hint}</p>}
    </Card>
  );
}

export function Toggle({
  isActive,
  onChange,
  ariaLabel,
  disabled = false,
}: {
  readonly isActive: boolean;
  readonly onChange?: () => void;
  readonly ariaLabel?: string;
  readonly disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={isActive}
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'w-10 h-5 rounded-full relative transition duration-200 ease-in-out border-[0.5px] disabled:cursor-not-allowed disabled:opacity-45',
        isActive ? 'bg-orange-500 border-orange-500' : 'bg-stone-800 border-stone-700',
      )}
    >
      <span
        className={cn(
          'w-4 h-4 bg-white rounded-full absolute top-[1px] transition-all duration-200',
          isActive ? 'left-[21px]' : 'left-[3px]',
        )}
      />
    </button>
  );
}
