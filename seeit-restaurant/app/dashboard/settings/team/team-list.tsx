'use client';

import * as React from 'react';
import {
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useBrand } from '@/components/BrandContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SheetBody, SheetFooter } from '@/components/ui/sheet';
import { FormSheet } from '@/components/FormSheet';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { initials } from '@/lib/utils';
import type { TeamRole } from '@/lib/database.types';

type Member = {
  id: string;
  role: TeamRole;
  location_ids: string[] | null;
  created_at: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    is_suspended: boolean | null;
  } | null;
};

const ROLE_TONE: Record<TeamRole, 'primary' | 'secondary' | 'default'> = {
  owner: 'primary',
  manager: 'secondary',
  staff: 'default',
};

export function TeamList() {
  const { currentBrandId, currentBrand, brandLocations } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [toRemove, setToRemove] = React.useState<Member | null>(null);
  const [reloadKey, setReloadKey] = React.useState(0);

  const reload = React.useCallback(() => setReloadKey((k) => k + 1), []);

  React.useEffect(() => {
    if (!currentBrandId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('team_members')
        .select(
          'id, role, location_ids, created_at, user:users(id, name, email, avatar_url, is_suspended)',
        )
        .eq('brand_id', currentBrandId)
        .order('created_at', { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load team: ${error.message}`);
        setMembers([]);
      } else {
        setMembers((data ?? []) as unknown as Member[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [currentBrandId, reloadKey]);

  async function remove() {
    if (!toRemove) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', toRemove.id);
    if (error) {
      toast.error(`Remove failed: ${error.message}`);
      return;
    }
    toast.success(`Removed ${toRemove.user?.email ?? 'team member'}`);
    setToRemove(null);
    reload();
  }

  if (!currentBrandId) {
    return (
      <Card className="p-0">
        <EmptyState
          icon={UsersIcon}
          title="No brand selected"
          description="Pick a brand in the sidebar to manage its team."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-muted-foreground">
          People with access to manage{' '}
          <span className="font-medium text-foreground">
            {currentBrand?.name ?? 'this brand'}
          </span>
          . Managers and staff only see locations they're assigned to.
        </p>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add team member
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="space-y-3 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No team yet"
            description="Add an owner or manager so someone can run the day-to-day on this brand."
            action={
              <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add team member
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const assigned = (m.location_ids ?? []).map(
                (id) => brandLocations.find((l) => l.id === id)?.name ?? id,
              );
              const allAccess = !m.location_ids || m.location_ids.length === 0;
              return (
                <li
                  key={m.id}
                  className="flex flex-col gap-3 px-6 py-3.5 sm:flex-row sm:items-center"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={m.user?.avatar_url ?? undefined} />
                    <AvatarFallback>
                      {initials(m.user?.name ?? m.user?.email ?? '?')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {m.user?.name ?? m.user?.email ?? 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.user?.email}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <Badge variant={ROLE_TONE[m.role]} className="gap-1 capitalize">
                        <Shield className="h-3 w-3" />
                        {m.role}
                      </Badge>
                      {m.user?.is_suspended && (
                        <Badge variant="destructive">Suspended</Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        ·{' '}
                        {allAccess
                          ? 'All locations'
                          : assigned.slice(0, 3).join(', ') +
                            (assigned.length > 3
                              ? `, +${assigned.length - 3} more`
                              : '')}
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setEditing(m)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setToRemove(m)}
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <MemberForm
        open={addOpen}
        onOpenChange={setAddOpen}
        brandId={currentBrandId}
        locations={brandLocations}
        onSaved={reload}
      />
      <MemberForm
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        brandId={currentBrandId}
        locations={brandLocations}
        member={editing}
        onSaved={reload}
      />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title={`Remove ${toRemove?.user?.email ?? 'this person'}?`}
        description="They'll lose access to this brand. You can re-add them later."
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />
    </>
  );
}

function MemberForm({
  open,
  onOpenChange,
  brandId,
  locations,
  member,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brandId: string;
  locations: { id: string; name: string; city: string | null }[];
  member?: Member | null;
  onSaved: () => void;
}) {
  const isEdit = !!member;
  const submittingRef = React.useRef(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [role, setRole] = React.useState<TeamRole>('manager');
  const [locationIds, setLocationIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (open) {
      setEmail(member?.user?.email ?? '');
      setRole((member?.role ?? 'manager') as TeamRole);
      setLocationIds(member?.location_ids ?? []);
    }
  }, [open, member?.id, member?.role, member?.location_ids, member?.user?.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!isEdit && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      toast.error('Enter a valid email');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const supabase = createClient();

      let userId = member?.user?.id;
      if (!isEdit) {
        const { data: row, error: lookupErr } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', email.trim())
          .maybeSingle();
        if (lookupErr) {
          toast.error(`User lookup failed: ${lookupErr.message}`);
          return;
        }
        if (!row) {
          toast.error('User not found — they need to sign up first');
          return;
        }
        userId = row.id;
      }
      if (!userId) {
        toast.error('Could not determine user');
        return;
      }

      const payload = {
        brand_id: brandId,
        user_id: userId,
        role,
        location_ids: locationIds,
      };

      if (isEdit && member) {
        const { error } = await supabase
          .from('team_members')
          .update({ role: payload.role, location_ids: payload.location_ids })
          .eq('id', member.id);
        if (error) {
          toast.error(`Save failed: ${error.message}`);
          return;
        }
        toast.success(`Updated ${member.user?.email ?? 'member'}`);
      } else {
        const { error } = await supabase.from('team_members').insert(payload);
        if (error) {
          toast.error(`Add failed: ${error.message}`);
          return;
        }
        toast.success(`Added ${email} as ${role}`);
      }
      onOpenChange(false);
      onSaved();
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit team member' : 'Add team member'}
      description={
        isEdit
          ? 'Change role or location scope.'
          : 'Grant access to a user who already has a SeeIt account.'
      }
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <SheetBody className="space-y-4">
          <div>
            <Label htmlFor="member-email">User email *</Label>
            <Input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@example.com"
              disabled={isEdit}
              className="mt-1.5"
              required={!isEdit}
            />
            <p className="mt-1 text-[11.5px] text-muted-foreground">
              Must match an existing SeeIt user.
            </p>
          </div>

          <div>
            <Label>Role *</Label>
            <div className="mt-1.5">
              <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">
                    Owner — full control of this brand
                  </SelectItem>
                  <SelectItem value="manager">
                    Manager — edit menus, hours, photos
                  </SelectItem>
                  <SelectItem value="staff">
                    Staff — view-only access
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Locations</Label>
            <p className="mt-1 mb-2 text-[11.5px] text-muted-foreground">
              Leave empty to grant access to all current and future locations.
            </p>
            {locations.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-warm-50/60 px-3 py-4 text-center text-[12px] text-muted-foreground">
                No locations on this brand yet.
              </p>
            ) : (
              <div className="grid gap-1.5 sm:grid-cols-2">
                {locations.map((l) => {
                  const checked = locationIds.includes(l.id);
                  return (
                    <label
                      key={l.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 hover:border-warm-300"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const cur = new Set(locationIds);
                          if (c) cur.add(l.id);
                          else cur.delete(l.id);
                          setLocationIds(Array.from(cur));
                        }}
                      />
                      <span className="min-w-0 flex-1 text-[13px]">
                        <span className="font-medium">{l.name}</span>
                        {l.city && (
                          <span className="text-muted-foreground"> · {l.city}</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : isEdit ? (
              'Save changes'
            ) : (
              'Add member'
            )}
          </Button>
        </SheetFooter>
      </form>
    </FormSheet>
  );
}
