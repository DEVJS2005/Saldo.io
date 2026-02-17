import { clsx } from 'clsx';

export const Card = ({ children, className, title, description, action }) => {
  return (
    <div className={clsx('bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-sm overflow-hidden', className)}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <div>
                {title && <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>}
                {description && <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>}
            </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};
