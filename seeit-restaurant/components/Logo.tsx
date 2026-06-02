import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  withText?: boolean;
  /** Show the small "Admin" suffix beside the wordmark. */
  showAdmin?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const SIZES = {
  sm: { mark: 'h-6 w-6', text: 'text-base' },
  md: { mark: 'h-8 w-8', text: 'text-lg' },
  lg: { mark: 'h-10 w-10', text: 'text-2xl' },
};

export function Logo({
  className,
  withText = true,
  showAdmin = false,
  size = 'md',
}: Props) {
  const s = SIZES[size];
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={s.mark}
        aria-hidden
      >
        <rect width="40" height="40" rx="10" fill="#E85D3A" />
        <path
          d="M8 20c3.2-6 7.6-9 12-9s8.8 3 12 9c-3.2 6-7.6 9-12 9s-8.8-3-12-9Z"
          stroke="#fff"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="20" cy="20" r="3.5" fill="#fff" />
      </svg>
      {withText && (
        <span className={cn('font-semibold tracking-tight text-foreground', s.text)}>
          SeeIt
          {showAdmin && (
            <span className="ml-1.5 text-muted-foreground font-medium">Admin</span>
          )}
        </span>
      )}
    </div>
  );
}
