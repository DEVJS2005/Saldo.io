import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export const Select = ({ label, options, error, className, wrapperClassName, ...props }) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={clsx(
            'w-full appearance-none bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 pr-10 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all cursor-pointer',
            error && 'border-[var(--danger)] focus:ring-[var(--danger)]',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
          <ChevronDown size={18} />
        </div>
      </div>
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
};
