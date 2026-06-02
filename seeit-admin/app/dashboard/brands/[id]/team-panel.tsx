'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Plus, Shield, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormSheet } from '@/components/FormSheet';
import { SheetBody, SheetFooter } from '@/components/ui/sheet';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Checkbox } from '@/components/ui/checkbox';
import { createClient } from '@/lib/supabase/client';
import { logAudit } from '@/lib/audit';
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

type Loc = { id: string; name: string; city: string | null };

const schema = z.object({
  user_email: z.string().email('Enter a valid email'),
  role: z.enum(['owner', 'manager', 'staff']),
  location_ids: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

const ROLE_TONE: Record<TeamRole, 'primary' | 'secondary' | 'default'> = {
  owner: 'primary',
  manager: 'secondary',
  staff: 'default',
};

export function TeamPanel({
  brandId,
  members,
  locations,
}: {
  brandId: string;
  members: Member[];
  locations: Loc[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [toRemove, setToRemove] = React.useState<Member | null>(null);

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
    await logAudit(supabase, {
      action: 'remove',
      targetType: 'team_member',
      targetId: toRemove.id,
      targetLabel: toRemove.user?.email ?? toRemove.user?.name ?? null,
      metadata: { brand_id: brandId, role: toRemove.role },
    });
    toast.success(`Removed ${toRemove.user?.email ?? 'team member'}`);
    setToRemove(null);
    router.refresh();
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">
            People with access to manage this store. Owners can do anything;
            managers and staff can only see locations they're assigned to.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add team member
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        {members.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No team yet"
            description="Add an owner or manager so someone can run the day-to-day on this store."
            action={
              <Button onClick={() => setAddOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Add team member
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const assignedLocs = (m.location_ids ?? []).map((id) => {
                const l = locations.find((x) => x.id === id);
                return l?.name ?? id;
              });
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
                      {assignedLocs.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          ·{' '}
                          {assignedLocs.length === locations.length
                            ? 'All locations'
                            : assignedLocs.slice(0, 3).join(', ') +
                              (assignedLocs.length > 3
                                ? `, +${assignedLocs.length - 3} more`
                                : '')}
                        </span>
                      )}
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
        brandId={brandId}
        locations={locations}
      />
      <MemberForm
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        brandId={brandId}
        locations={locations}
        member={editing}
      />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title={`Remove ${toRemove?.user?.email ?? 'this person'} from the team?`}
        description="They'll lose access to this store. You can re-add them later."
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  brandId: string;
  locations: Loc[];
  member?: Member | null;
}) {
  const router = useRouter();
  const isEdit = !!member;
  const submittingRef = React.useRef(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_email: member?.user?.email ?? '',
      role: (member?.role ?? 'manager') as TeamRole,
      location_ids: member?.location_ids ?? [],
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        user_email: member?.user?.email ?? '',
        role: (member?.role ?? 'manager') as TeamRole,
        location_ids: member?.location_ids ?? [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member?.id]);

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const supabase = createClient();
      // Resolve email → user id
      const { data: row, error: lookupErr } = await supabase
        .from('users')
        .select('id, email, name')
        .eq('email', values.user_email)
        .maybeSingle();
      if (lookupErr) {
        toast.error(`User lookup failed: ${lookupErr.message}`);
        return;
      }
      if (!row) {
        toast.error(`No user with email ${values.user_email}. Invite them first.`);
        return;
      }

      const payload = {
        brand_id: brandId,
        user_id: row.id,
        role: values.role,
        location_ids: values.location_ids,
      };

      if (isEdit && member) {
        const { error } = await supabase
          .from('team_members')
          .update(payload)
          .eq('id', member.id);
        if (error) {
          toast.error(`Save failed: ${error.message}`);
          return;
        }
        await logAudit(supabase, {
          action: 'update',
          targetType: 'team_member',
          targetId: member.id,
          targetLabel: row.email,
          metadata: { brand_id: brandId, role: values.role },
        });
        toast.success(`Updated ${row.email}`);
      } else {
        const { data: inserted, error } = await supabase
          .from('team_members')
          .insert(payload)
          .select('id')
          .single();
        if (error) {
          toast.error(`Add failed: ${error.message}`);
          return;
        }
        await logAudit(supabase, {
          action: 'add',
          targetType: 'team_member',
          targetId: inserted?.id ?? null,
          targetLabel: row.email,
          metadata: { brand_id: brandId, role: values.role },
        });
        toast.success(`Added ${row.email} as ${values.role}`);
      }
      onOpenChange(false);
      router.refresh();
    } finally {
      submittingRef.current = false;
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
          : 'Grant a user access to manage this store.'
      }
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-4">
            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User email *</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="manager@example.com"
                      disabled={isEdit}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Must match an existing user in the system.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="owner">
                        Owner — full control of this store
                      </SelectItem>
                      <SelectItem value="manager">
                        Manager — edit menus, hours, photos
                      </SelectItem>
                      <SelectItem value="staff">
                        Staff — view-only access
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locations</FormLabel>
                  <FormDescription>
                    Leave empty to grant access to all current and future locations.
                  </FormDescription>
                  {locations.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border bg-warm-50/60 px-3 py-4 text-center text-[12px] text-muted-foreground">
                      No locations on this store yet.
                    </p>
                  ) : (
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {locations.map((l) => {
                        const checked = (field.value ?? []).includes(l.id);
                        return (
                          <label
                            key={l.id}
                            className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-2.5 py-2 hover:border-warm-300"
                          >
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(c) => {
                                const cur = new Set(field.value ?? []);
                                if (c) cur.add(l.id);
                                else cur.delete(l.id);
                                field.onChange(Array.from(cur));
                              }}
                            />
                            <span className="min-w-0 flex-1 text-[13px]">
                              <span className="font-medium">{l.name}</span>
                              {l.city && (
                                <span className="text-muted-foreground">
                                  {' '}· {l.city}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </SheetBody>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
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
      </Form>
    </FormSheet>
  );
}
