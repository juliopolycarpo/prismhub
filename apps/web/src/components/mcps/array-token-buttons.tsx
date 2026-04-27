import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.ts';
import { Button } from '../ui';

interface ApproveButtonProps {
  readonly label: string;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

interface TokenIconButtonProps {
  readonly label: string;
  readonly icon: ReactNode;
  readonly onClick: () => void;
  readonly danger?: boolean;
  readonly disabled?: boolean;
}

export function ApproveButton({ label, disabled, onClick }: ApproveButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="h-9 w-9 shrink-0 border-[0.5px] border-green-500/25 bg-green-500/10 text-green-400 hover:bg-green-500/15 hover:text-green-300"
    >
      <Check size={16} />
    </Button>
  );
}

export function TokenIconButton({
  label,
  icon,
  onClick,
  danger = false,
  disabled = false,
}: TokenIconButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('h-6 w-6 rounded-full', danger && 'text-red-400 hover:text-red-300')}
    >
      {icon}
    </Button>
  );
}
