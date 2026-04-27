import { cn } from '../../lib/cn.ts';
import { Card } from './card.tsx';

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
