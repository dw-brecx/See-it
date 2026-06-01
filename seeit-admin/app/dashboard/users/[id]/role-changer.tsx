'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Pencil, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import type { UserRole } from '@/lib/database.types';

type Props = {
  userId: string;
  currentRole: UserRole;
  currentName: string | null;
};

const ROLE_LABEL: Record<UserRole, string> = {
  customer: 'Customer',
  restaurant_owner: 'Restaurant owner',
  admin: 'Admin',
};

export function RoleChanger({ userId, currentRole, currentName }: Props) {
  const router = useRouter();

  // Role
  const [selected, setSelected] = useState<UserRole>(currentRole);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirty = selected !== currentRole;

  // Name
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState(currentName ?? '');
  const [savingName, setSavingName] = useState(false);

  async function applyRoleChange() {
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

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setSavingName(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ name: name.trim() || null })
      .eq('id', userId);
    setSavingName(false);
    if (error) {
      toast.error(`Could not update name: ${error.message}`);
      return;
    }
    toast.success('Name updated');
    setNameOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setNameOpen(true)}
          className="gap-1.5"
        >
          <Pencil className="h-4 w-4" /> Edit name
        </Button>
        <Select value={selected} onValueChange={(v) => setSelected(v as UserRole)}>
          <SelectTrigger className="w-[200px]">
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
          className="gap-1.5"
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
        onConfirm={applyRoleChange}
      />

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Edit name</DialogTitle>
            <DialogDescription>
              The user's display name across the platform.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveName} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Leave blank to clear"
                disabled={savingName}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNameOpen(false)}
                disabled={savingName}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingName}
                className="w-full sm:w-auto"
              >
                {savingName ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
