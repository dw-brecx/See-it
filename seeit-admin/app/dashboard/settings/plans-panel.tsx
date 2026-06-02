'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/database.types';

const schema = z.object({
  name: z.string().min(1, 'Name required').max(60),
  slug: z
    .string()
    .min(1, 'Slug required')
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers, and hyphens only'),
  // Dollar amount the admin types (e.g. "9.99"). Stored as cents in DB.
  price_dollars: z
    .union([z.number(), z.string()])
    .transform((v) => {
      const n = typeof v === 'string' ? parseFloat(v || '0') : v;
      return Number.isFinite(n) ? n : 0;
    })
    .pipe(z.number().min(0)),
  billing_interval: z.enum(['month', 'year']),
  location_limit: z
    .union([z.number(), z.string(), z.literal('')])
    .transform((v) =>
      v === '' || v === undefined || v === null
        ? null
        : typeof v === 'string'
        ? parseInt(v, 10)
        : v,
    )
    .pipe(z.number().int().min(0).nullable()),
  features_text: z.string().optional(),
  is_active: z.boolean().default(true),
  display_order: z
    .union([z.number(), z.string()])
    .transform((v) => (typeof v === 'string' ? parseInt(v || '0', 10) : v))
    .pipe(z.number().int().min(0)),
});

type FormValues = z.infer<typeof schema>;

export function PlansPanel({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<Plan | null>(null);

  async function deletePlan() {
    if (!toDelete) return;
    const supabase = createClient();
    const { error } = await supabase.from('plans').delete().eq('id', toDelete.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success(`Deleted "${toDelete.name}"`);
    setToDelete(null);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Plans</CardTitle>
            <CardDescription>
              Pricing tiers your restaurant stores can be assigned to.
            </CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add plan
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {plans.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No plans yet. Add your first plan to assign stores to it.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {plans.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <span className="text-xs font-mono text-muted-foreground">
                        {p.slug}
                      </span>
                      {p.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="default">Inactive</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        ${(p.price_cents / 100).toFixed(2)}
                      </span>{' '}
                      / {p.billing_interval} ·{' '}
                      {p.location_limit == null
                        ? 'Unlimited locations'
                        : `Up to ${p.location_limit} location${p.location_limit === 1 ? '' : 's'}`}
                    </p>
                    {Array.isArray(p.features) && p.features.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {p.features.map((f, i) => (
                          <li
                            key={i}
                            className="inline-flex items-center gap-1 rounded-md bg-warm-50 px-2 py-0.5 text-[11px] text-warm-700"
                          >
                            <Check className="h-3 w-3 text-emerald-600" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => setEditing(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => setToDelete(p)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <PlanForm
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={() => router.refresh()}
      />
      <PlanForm
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        plan={editing}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete "${toDelete?.name}"?`}
        description="Any store assigned to this plan will be unassigned."
        confirmLabel="Delete"
        destructive
        onConfirm={deletePlan}
      />
    </>
  );
}

function PlanForm({
  open,
  onOpenChange,
  plan,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  plan?: Plan | null;
  onSaved?: () => void;
}) {
  const isEdit = !!plan;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: plan?.name ?? '',
      slug: plan?.slug ?? '',
      price_dollars: (plan?.price_cents ?? 0) / 100,
      billing_interval: (plan?.billing_interval ?? 'month') as 'month' | 'year',
      location_limit: plan?.location_limit ?? null,
      features_text: Array.isArray(plan?.features) ? plan!.features.join('\n') : '',
      is_active: plan?.is_active ?? true,
      display_order: plan?.display_order ?? 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        name: plan?.name ?? '',
        slug: plan?.slug ?? '',
        price_dollars: (plan?.price_cents ?? 0) / 100,
        billing_interval: (plan?.billing_interval ?? 'month') as 'month' | 'year',
        location_limit: plan?.location_limit ?? null,
        features_text: Array.isArray(plan?.features) ? plan!.features.join('\n') : '',
        is_active: plan?.is_active ?? true,
        display_order: plan?.display_order ?? 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, plan?.id]);

  const submittingRef = React.useRef(false);

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const supabase = createClient();
      const features = (values.features_text ?? '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        price_cents: Math.round(values.price_dollars * 100),
        billing_interval: values.billing_interval,
        location_limit: values.location_limit,
        features,
        is_active: values.is_active,
        display_order: values.display_order,
      };
      if (isEdit && plan) {
        const { error } = await supabase.from('plans').update(payload).eq('id', plan.id);
        if (error) {
          toast.error(`Save failed: ${error.message}`);
          return;
        }
        toast.success(`Updated ${payload.name}`);
      } else {
        const { error } = await supabase.from('plans').insert(payload);
        if (error) {
          toast.error(`Create failed: ${error.message}`);
          return;
        }
        toast.success(`Created ${payload.name}`);
      }
      onOpenChange(false);
      onSaved?.();
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <FormSheet
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${plan?.name}` : 'Add plan'}
      description="Plans define what each store gets for what they pay."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug *</FormLabel>
                    <FormControl>
                      <Input placeholder="pro" {...field} />
                    </FormControl>
                    <FormDescription>Used in URLs and API calls.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="price_dollars"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          placeholder="49.00"
                          className="pl-7"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter dollars and cents — e.g. 9.99 or 49 for $49.00.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="billing_interval"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing interval *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="month">Monthly</SelectItem>
                        <SelectItem value="year">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location limit</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="leave blank for unlimited"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : e.target.value)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="features_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder={'One feature per line, e.g.\nUp to 5 locations\nPriority support\nCustom branding'}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Shown on the marketing site and the store-assignment screen.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display order</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormDescription>Lower = appears first.</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                    <div>
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Inactive plans are hidden from new store assignments.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
                'Create plan'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
