import { Badge } from '@/components/ui/badge';
import type { UserRole } from '@/lib/database.types';

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  admin: 'Admin',
};

export function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'admin') return <Badge variant="primary">{ROLE_LABEL[role]}</Badge>;
  if (role === 'restaurant_owner') return <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>;
  return <Badge variant="default">{ROLE_LABEL[role]}</Badge>;
}
