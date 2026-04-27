import { type ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';

export type BadgeVariant = 'default' | 'success' | 'warning';

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
