import { cn } from '@/lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        aria-hidden
      >
        <rect width="48" height="48" rx="12" fill="#E85D3A" />
        <path
          d="M9 24c4-7 10-10 15-10s11 3 15 10c-4 7-10 10-15 10S13 31 9 24Z"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="4.5" fill="#fff" />
      </svg>
      {withText && (
        <span className="text-lg font-extrabold tracking-tight">
          See<span className="text-terracotta-500">It</span>
          <span className="ml-1.5 inline-flex items-center rounded-full bg-terracotta-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-terracotta-700">
            ADMIN
          </span>
        </span>
      )}
    </div>
  );
}
