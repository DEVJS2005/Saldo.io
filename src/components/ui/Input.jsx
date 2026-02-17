import { clsx } from 'clsx';

export const Input = ({
  label,
  error,
  icon: Icon,
  className,
  wrapperClassName,
  ...props
}) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <Icon size={18} />
          </div>
        )}
        <input
          className={clsx(
            'w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all',
            Icon && 'pl-10',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)]',
            className
          )}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
};
