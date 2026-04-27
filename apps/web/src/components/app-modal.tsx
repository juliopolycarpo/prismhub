import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../lib/cn.ts';
import { Button, Card } from './ui';

type ModalSize = 'md' | 'lg';

const MODAL_WIDTH: Record<ModalSize, string> = {
  md: 'max-w-xl',
  lg: 'max-w-3xl',
};

interface AppModalProps {
  readonly title: string;
  readonly description?: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly size?: ModalSize;
  readonly bodyClassName?: string;
}

/**
 * Keeps dashboard modal framing consistent across feature surfaces.
 * @example <AppModal title="Settings" onClose={close}>...</AppModal>
 */
export function AppModal(props: AppModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <Card
        className={cn(
          'flex max-h-[88vh] w-full flex-col overflow-hidden border-stone-800 shadow-2xl',
          MODAL_WIDTH[props.size ?? 'md'],
        )}
        style={{ backgroundColor: 'var(--modal-bg)' }}
      >
        <ModalHeader title={props.title} description={props.description} onClose={props.onClose} />
        <div className={cn('flex-1 overflow-y-auto px-6 py-5', props.bodyClassName)}>
          {props.children}
        </div>
        {props.footer && <ModalFooter>{props.footer}</ModalFooter>}
      </Card>
    </div>
  );
}

function ModalHeader({
  title,
  description,
  onClose,
}: {
  readonly title: string;
  readonly description: string | undefined;
  readonly onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b-[0.5px] border-stone-800 px-6 py-5">
      <div>
        <h2 className="text-lg font-semibold text-stone-100">{title}</h2>
        {description && <p className="mt-1 text-xs text-stone-500">{description}</p>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Fechar"
        title="Fechar"
        onClick={onClose}
        className="h-8 w-8 shrink-0 rounded-full bg-stone-800/40 text-stone-400"
      >
        <X size={16} />
      </Button>
    </div>
  );
}

/**
 * Renders modal actions with the same visual boundary as the modal header.
 * @example <ModalFooter><Button>Save</Button></ModalFooter>
 */
export function ModalFooter({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cn(
        'flex justify-end gap-2 border-t-[0.5px] border-stone-800 px-6 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
}
