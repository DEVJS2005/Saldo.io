export function Skeleton({ className, ...props }) {
    return (
        <div
            className={`animate-pulse rounded-md bg-[var(--bg-input)]/50 ${className}`}
            {...props}
        />
    );
}
