import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
