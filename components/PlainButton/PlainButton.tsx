import { type IconSource } from '@/types/common';

import { Icon } from '../Icon';

interface PlainButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconSource;
  onClick: () => void;
}

export function PlainButton({
  children,
  loading,
  disabled,
  icon,
  onClick,
}: PlainButtonProps) {
  const iconMarkup = icon ? (
    <Icon source={!loading ? icon : 'spinner'} />
  ) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className="text-sm text-nowrap font-normal px-2 py-1 hover:bg-indigo-50 rounded-sm flex flex-nowrap items-center gap-1 cursor-pointer text-indigo-600 hover:text-indigo-800 disabled:text-zinc-400 disabled:bg-zinc-50 disabled:cursor-not-allowed transition-colors"
    >
      {iconMarkup}
      <span>{children}</span>
    </button>
  );
}
