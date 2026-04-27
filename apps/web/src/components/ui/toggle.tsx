import { cn } from '../../lib/cn.ts';

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
