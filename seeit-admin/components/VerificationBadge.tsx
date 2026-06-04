import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Show the word "Verified" next to the check. */
  withLabel?: boolean;
};

/**
 * Blue checkmark shown next to a store's name when it's been admin-verified.
 * Twitter/Instagram style — round filled mark with a white tick.
 */
export function VerificationBadge({
  verified,
  size = 'md',
  className,
  withLabel = false,
}: Props) {
  if (!verified) return null;
  const sizeCls = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-[#1DA1F2]', className)}
      title="Verified store"
      aria-label="Verified store"
    >
      <BadgeCheck className={cn(sizeCls, 'fill-[#1DA1F2] text-white')} strokeWidth={2.25} />
      {withLabel && (
        <span className="text-[12px] font-semibold">Verified</span>
      )}
    </span>
  );
}
