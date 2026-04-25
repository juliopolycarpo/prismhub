import type { ReactNode } from 'react';
import { Card } from './ui.tsx';

export function SettingsSection({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden bg-stone-900/50">
      <div className="border-b-[0.5px] border-stone-800 px-6 py-5">
        <h2 className="text-base font-medium text-stone-200">{title}</h2>
        <p className="mt-1 text-sm text-stone-400">{description}</p>
      </div>
      <div className="divide-y-[0.5px] divide-stone-800">{children}</div>
    </Card>
  );
}

export function SettingsRow({
  title,
  description,
  children,
  rightText,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
  readonly rightText?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-stone-800/10">
      <div className="min-w-0">
        <h3 className="text-sm font-medium text-stone-300">{title}</h3>
        {description && <p className="mt-1 text-xs text-stone-500">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
      {rightText && <span className="shrink-0 font-mono text-sm text-stone-400">{rightText}</span>}
    </div>
  );
}
