import { Badge } from '@/components/ui/badge';
import type { SubscriptionStatus } from '@/lib/database.types';

const LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'default' }> = {
  active: { label: 'Active', variant: 'success' },
  trialing: { label: 'Trialing', variant: 'success' },
  past_due: { label: 'Past due', variant: 'warning' },
  unpaid: { label: 'Unpaid', variant: 'warning' },
  canceled: { label: 'Canceled', variant: 'destructive' },
  incomplete: { label: 'Incomplete', variant: 'warning' },
  incomplete_expired: { label: 'Expired', variant: 'destructive' },
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | string | null }) {
  if (!status) return <Badge variant="default">—</Badge>;
  const cfg = LABELS[status] ?? { label: status, variant: 'default' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SuspendedBadge({ suspended }: { suspended: boolean }) {
  return suspended ? (
    <Badge variant="destructive">Suspended</Badge>
  ) : (
    <Badge variant="success">Active</Badge>
  );
}

export function LocationOpenBadge({ closed }: { closed: boolean }) {
  return closed ? (
    <Badge variant="warning">Temporarily closed</Badge>
  ) : (
    <Badge variant="success">Active</Badge>
  );
}
