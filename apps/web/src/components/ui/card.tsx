import { type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn.ts';

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
