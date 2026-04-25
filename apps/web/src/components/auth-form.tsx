import { Sparkles } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

const FORM_CARD_CLASS =
  'w-full max-w-sm rounded-lg border-[0.5px] border-stone-800 bg-stone-950 p-8 space-y-6';
const SUBMIT_BUTTON_CLASS =
  'w-full rounded-md bg-orange-500 px-3 py-2 text-sm font-medium text-stone-950 hover:bg-orange-400 disabled:opacity-50';

export function AuthShell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-stone-900 text-stone-200 font-sans">
      {children}
    </div>
  );
}

export function AuthCard({
  children,
  onSubmit,
  title,
  subtitle,
}: {
  readonly children: ReactNode;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly title: string;
  readonly subtitle: string | null;
}) {
  return (
    <form onSubmit={onSubmit} noValidate className={FORM_CARD_CLASS}>
      <AuthHeader title={title} subtitle={subtitle} />
      {children}
    </form>
  );
}

export function AuthHeader({
  title,
  subtitle,
}: {
  readonly title: string;
  readonly subtitle: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center border-[0.5px] border-orange-500/30">
        <Sparkles size={18} />
      </div>
      <div>
        <h1 className="font-semibold text-stone-100">{title}</h1>
        {subtitle && <p className="text-xs text-stone-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AuthSubmitButton({
  isSubmitting,
  idleLabel,
  busyLabel,
}: {
  readonly isSubmitting: boolean;
  readonly idleLabel: string;
  readonly busyLabel: string;
}) {
  return (
    <button type="submit" disabled={isSubmitting} className={SUBMIT_BUTTON_CLASS}>
      {isSubmitting ? busyLabel : idleLabel}
    </button>
  );
}

export function AuthAlert({ message }: { readonly message: string | null }) {
  return message ? (
    <p role="alert" className="text-xs text-red-400">
      {message}
    </p>
  ) : null;
}
