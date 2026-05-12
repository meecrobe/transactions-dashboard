'use client';

interface RetryButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function RetryButton({
  onClick,
  loading,
  disabled,
  children,
}: RetryButtonProps) {
  const isDisabled = disabled || loading;

  const spinnerMarkup = loading ? (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
        isDisabled
          ? 'cursor-not-allowed bg-zinc-100 text-zinc-400'
          : 'bg-indigo-600 text-white hover:bg-indigo-700',
        loading ? 'opacity-75' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {spinnerMarkup}
      {children}
    </button>
  );
}
