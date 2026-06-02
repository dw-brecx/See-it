'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { formatDate } from '@/lib/utils';
import type { DiscountCode, Plan } from '@/lib/database.types';

type CodeRow = DiscountCode & { applies_to_plan?: { name: string } | null };

const schema = z
  .object({
    code: z
      .string()
      .min(2, 'Code required')
      .max(60)
      .regex(/^[A-Z0-9_-]+$/, 'Uppercase letters, numbers, _ and - only'),
    description: z.string().max(200).optional().or(z.literal('')),
    kind: z.enum(['percent', 'amount']),
    percent_off: z
      .union([z.number(), z.string(), z.literal('')])
      .transform((v) =>
        v === '' || v == null ? null : typeof v === 'string' ? parseInt(v, 10) : v,
      )
      .pipe(z.number().int().min(1).max(100).nullable()),
    amount_off_cents: z
      .union([z.number(), z.string(), z.literal('')])
      .transform((v) =>
        v === '' || v == null ? null : typeof v === 'string' ? parseInt(v, 10) : v,
      )
      .pipe(z.number().int().min(1).nullable()),
    valid_until: z.string().optional().or(z.literal('')),
    max_uses: z
      .union([z.number(), z.string(), z.literal('')])
      .transform((v) =>
        v === '' || v == null ? null : typeof v === 'string' ? parseInt(v, 10) : v,
      )
      .pipe(z.number().int().min(1).nullable()),
    applies_to_plan_id: z.string().optional().or(z.literal('')),
    is_active: z.boolean().default(true),
  })
  .refine(
    (v) =>
      (v.kind === 'percent' && v.percent_off != null) ||
      (v.kind === 'amount' && v.amount_off_cents != null),
    {
      message: 'Set a value for the chosen discount kind.',
      path: ['kind'],
    },
  );

type FormValues = z.infer<typeof schema>;

export function DiscountCodesPanel({
  codes,
  plans,
}: {
  codes: CodeRow[];
  plans: Plan[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<CodeRow | null>(null);
  const [addOpen, setAddOpen] = React.useState(false);
  const [toDelete, setToDelete] = React.useState<CodeRow | null>(null);

  async function deleteCode() {
    if (!toDelete) return;
    const supabase = createClient();
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', toDelete.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
      return;
    }
    toast.success(`Deleted "${toDelete.code}"`);
    setToDelete(null);
    router.refresh();
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Discount codes</CardTitle>
            <CardDescription>
              Promo codes brands can apply at checkout. Percent or fixed amount.
            </CardDescription>
          </div>
          <Button onClick={() => setAddOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add code
          </Button>
        </CardHeader>
        <CardContent className="px-0">
          {codes.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              No codes yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {codes.map((c) => {
                const used = c.used_count ?? 0;
                const maxed = c.max_uses != null && used >= c.max_uses;
                const expired =
                  c.valid_until != null && new Date(c.valid_until) < new Date();
                return (
                  <li
                    key={c.id}
                    className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-terracotta-50 text-terracotta-600">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono text-sm font-semibold tracking-wide">
                          {c.code}
                        </p>
                        {c.is_active && !expired && !maxed ? (
                          <Badge variant="success">Active</Badge>
                        ) : expired ? (
                          <Badge variant="warning">Expired</Badge>
                        ) : maxed ? (
                          <Badge variant="warning">Used up</Badge>
                        ) : (
                          <Badge variant="default">Inactive</Badge>
                        )}
                        {c.applies_to_plan?.name && (
                          <Badge variant="secondary">
                            For {c.applies_to_plan.name}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {c.percent_off != null
                            ? `${c.percent_off}% off`
                            : c.amount_off_cents != null
                            ? `$${(c.amount_off_cents / 100).toFixed(2)} off`
                            : '—'}
                        </span>
                        {c.description && <> · {c.description}</>}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Used {used}
                        {c.max_uses != null ? ` / ${c.max_uses}` : ''}
                        {c.valid_until && ` · Expires ${formatDate(c.valid_until)}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setEditing(c)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setToDelete(c)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <CodeForm
        open={addOpen}
        onOpenChange={setAddOpen}
        plans={plans}
        onSaved={() => router.refresh()}
      />
      <CodeForm
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        code={editing}
        plans={plans}
        onSaved={() => router.refresh()}
      />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete code "${toDelete?.code}"?`}
        description="The code will no longer be redeemable."
        confirmLabel="Delete"
        destructive
        onConfirm={deleteCode}
      />
    </>
  );
}

const NONE = '__none__';

function CodeForm({
  open,
  onOpenChange,
  code,
  plans,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  code?: CodeRow | null;
  plans: Plan[];
  onSaved?: () => void;
}) {
  const isEdit = !!code;
  const initialKind: 'percent' | 'amount' =
    code?.amount_off_cents != null ? 'amount' : 'percent';

  const form = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      code: code?.code ?? '',
      description: code?.description ?? '',
      kind: initialKind,
      percent_off: code?.percent_off ?? null,
      amount_off_cents: code?.amount_off_cents ?? null,
      valid_until: code?.valid_until ? code.valid_until.slice(0, 10) : '',
      max_uses: code?.max_uses ?? null,
      applies_to_plan_id: code?.applies_to_plan_id ?? '',
      is_active: code?.is_active ?? true,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        code: code?.code ?? '',
        description: code?.description ?? '',
        kind: initialKind,
        percent_off: code?.percent_off ?? null,
        amount_off_cents: code?.amount_off_cents ?? null,
        valid_until: code?.valid_until ? code.valid_until.slice(0, 10) : '',
        max_uses: code?.max_uses ?? null,
        applies_to_plan_id: code?.applies_to_plan_id ?? '',
        is_active: code?.is_active ?? true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, code?.id]);

  const watchKind = form.watch('kind');
  const submittingRef = React.useRef(false);

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const supabase = createClient();
      const payload = {
        code: values.code.trim().toUpperCase(),
        description: values.description?.trim() || null,
        percent_off: values.kind === 'percent' ? values.percent_off : null,
        amount_off_cents: values.kind === 'amount' ? values.amount_off_cents : null,
        valid_until: values.valid_until ? values.valid_until : null,
        max_uses: values.max_uses,
        applies_to_plan_id: values.applies_to_plan_id || null,
        is_active: values.is_active,
      };
      if (isEdit && code) {
        const { error } = await supabase
          .from('discount_codes')
          .update(payload)
          .eq('id', code.id);
        if (error) {
          toast.error(`Save failed: ${error.message}`);
          return;
        }
        toast.success(`Updated ${payload.code}`);
      } else {
        const { error } = await supabase.from('discount_codes').insert(payload);
        if (error) {
          toast.error(`Create failed: ${error.message}`);
          return;
        }
        toast.success(`Created ${payload.code}`);
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
      title={isEdit ? `Edit ${code?.code}` : 'Add discount code'}
      description="Promo code applied at billing time."
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex h-full min-h-0 flex-col"
        >
          <SheetBody className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="LAUNCH50"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>What customers type at checkout.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Launch week discount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="percent">Percent off (%)</SelectItem>
                      <SelectItem value="amount">Fixed amount off ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {watchKind === 'percent' ? (
              <FormField
                control={form.control}
                name="percent_off"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percent off *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="50"
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
            ) : (
              <FormField
                control={form.control}
                name="amount_off_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount off (cents) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1000"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : e.target.value)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value
                        ? `$${(Number(field.value) / 100).toFixed(2)}`
                        : '$0.00'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank for no expiry.</FormDescription>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_uses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max uses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Unlimited"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value === '' ? null : e.target.value)
                        }
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="applies_to_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Applies to plan</FormLabel>
                  <Select
                    value={field.value || NONE}
                    onValueChange={(v) => field.onChange(v === NONE ? '' : v)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Any plan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NONE}>— any plan —</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      Inactive codes can't be redeemed.
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
                'Create code'
              )}
            </Button>
          </SheetFooter>
        </form>
      </Form>
    </FormSheet>
  );
}
