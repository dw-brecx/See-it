'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/database.types';

type Props = { userId: string; currentRole: UserRole };

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  admin: 'Admin',
};

export function RoleChanger({ userId, currentRole }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole>(currentRole);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dirty = selected !== currentRole;

  async function applyChange() {
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ role: selected })
      .eq('id', userId);

    if (error) {
      toast.error(`Could not change role: ${error.message}`);
      return;
    }
    toast.success(`Role changed to ${ROLE_LABEL[selected]}`);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Select value={selected} onValueChange={(v) => setSelected(v as UserRole)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customer">Customer</SelectItem>
            <SelectItem value="restaurant_owner">Restaurant owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={dirty ? 'default' : 'outline'}
          disabled={!dirty}
          onClick={() => setConfirmOpen(true)}
        >
          <Shield className="h-4 w-4" />
          Change role
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Change role to ${ROLE_LABEL[selected]}?`}
        description={
          selected === 'admin'
            ? 'This user will gain full admin access to this dashboard. Only change to admin for trusted team members.'
            : `This user will lose any role-specific access they currently have as ${ROLE_LABEL[currentRole]}.`
        }
        confirmLabel="Change role"
        destructive={selected === 'admin' || currentRole === 'admin'}
        onConfirm={applyChange}
      />
    </>
  );
}
