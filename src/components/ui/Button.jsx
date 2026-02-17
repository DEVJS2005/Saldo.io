import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // primary, secondary, danger, ghost
  size = 'md', // sm, md, lg
  className,
  isLoading,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl';
  
  const variants = {
    primary: 'bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] focus:ring-[var(--primary)]',
    secondary: 'bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] border border-[var(--border-color)]',
    danger: 'bg-[var(--danger)] text-white hover:bg-red-600 focus:ring-red-500',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]',
  };

  const sizes = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-base px-4 py-2 gap-2',
    lg: 'text-lg px-6 py-3 gap-3',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
};
