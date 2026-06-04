import * as React from 'react';
import { Badge } from '../ui/Badge';
import { WeekHours } from '@/lib/types';
import { isOpenNow, todayHours } from '@/lib/utils/hours';

export function OpenClosedBadge({ hours }: { hours: WeekHours | null | undefined }) {
  const open = isOpenNow(hours);
  if (open === null) {
    const label = todayHours(hours);
    if (!label || label === 'Closed') return <Badge label="See hours" variant="neutral" />;
    return <Badge label={label} variant="neutral" />;
  }
  if (open) return <Badge label={`Open · ${todayHours(hours)}`} variant="success" />;
  return <Badge label="Closed" variant="danger" />;
}
