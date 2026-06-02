'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, Sparkles, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Plan } from '@/lib/database.types';

type OwnedBrand = {
  id: string;
  name: string;
  plan_id: string | null;
  logo_url: string | null;
};

type Props = {
  plans: Plan[];
  ownedBrands: OwnedBrand[];
  isAdmin: boolean;
};

function fmtPrice(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function PlansGrid({ plans, ownedBrands, isAdmin }: Props) {
  const router = useRouter();
  const [selectedBrandId, setSelectedBrandId] = React.useState<string>(
    ownedBrands[0]?.id ?? '',
  );
  // Optimistic local copy of brands so the "Current" badge updates immediately
  const [brands, setBrands] = React.useState<OwnedBrand[]>(ownedBrands);
  const [pendingPlanId, setPendingPlanId] = React.useState<string | null>(null);

  const currentBrand = brands.find((b) => b.id === selectedBrandId) ?? null;
  const currentPlanId = currentBrand?.plan_id ?? null;

  async function selectPlan(plan: Plan) {
    if (!currentBrand) {
      toast.error('Pick a store to update first.');
      return;
    }
    if (isAdmin) {
      toast.error("Admins can't change plans on stores they don't own.");
      return;
    }
    if (currentPlanId === plan.id) {
      toast.message(`${plan.name} is already your current plan.`);
      return;
    }
    setPendingPlanId(plan.id);
    // Optimistic update
    const prev = brands;
    setBrands((bs) =>
      bs.map((b) => (b.id === currentBrand.id ? { ...b, plan_id: plan.id } : b)),
    );
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('brands')
        .update({ plan_id: plan.id })
        .eq('id', currentBrand.id);
      if (error) {
        setBrands(prev);
        toast.error(`Couldn't update plan: ${error.message}`);
        return;
      }
      toast.success(
        'Plan updated — billing changes will apply on Stripe launch.',
      );
      router.refresh();
    } catch (e) {
      setBrands(prev);
      toast.error('Could not update plan.');
    } finally {
      setPendingPlanId(null);
    }
  }

  if (plans.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Sparkles}
            title="No plans available yet"
            description="Plans haven't been published. Check back soon."
          />
        </CardContent>
      </Card>
    );
  }

  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Store}
            title="No stores to assign"
            description="You don't own any stores yet. Plans are assigned per-store."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Brand picker */}
      {brands.length > 1 && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <p className="text-[12.5px] font-semibold text-foreground">
                Choosing plan for
              </p>
              <p className="text-[12px] text-muted-foreground">
                Plans are assigned per store. Pick the one you'd like to update.
              </p>
            </div>
            <div className="w-full sm:w-72">
              <Select
                value={selectedBrandId}
                onValueChange={setSelectedBrandId}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan, i) => {
          const isCurrent = currentPlanId === plan.id;
          const isPending = pendingPlanId === plan.id;
          // Highlight the middle plan visually as "recommended" if 3+ plans
          const isHighlight = plans.length >= 3 && i === 1;
          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex flex-col overflow-hidden transition-all',
                isCurrent && 'ring-2 ring-terracotta-500',
                isHighlight && !isCurrent && 'border-terracotta-200 shadow-soft-md',
              )}
            >
              {isHighlight && !isCurrent && (
                <div className="absolute right-4 top-4">
                  <Badge variant="primary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute right-4 top-4">
                  <Badge variant="success">Current plan</Badge>
                </div>
              )}
              <CardHeader className="space-y-1">
                <CardTitle className="text-[20px]">{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[36px] font-bold tracking-tight tabular-nums text-foreground">
                    {fmtPrice(plan.price_cents)}
                  </span>
                  <span className="text-[13px] text-muted-foreground">
                    / {plan.billing_interval}
                  </span>
                </div>
                <p className="text-[12.5px] text-muted-foreground">
                  {plan.location_limit == null
                    ? 'Unlimited locations'
                    : `Up to ${plan.location_limit} location${plan.location_limit === 1 ? '' : 's'}`}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="space-y-1.5">
                  {(plan.features ?? []).map((f, j) => (
                    <li
                      key={`${plan.id}-f-${j}`}
                      className="flex items-start gap-2 text-[13px] text-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex-1" />
                <Button
                  variant={isCurrent ? 'outline' : isHighlight ? 'default' : 'outline'}
                  className="w-full gap-1.5"
                  disabled={isCurrent || isPending || isAdmin}
                  onClick={() => selectPlan(plan)}
                  title={
                    isAdmin
                      ? "Admins can't change plans they don't own"
                      : undefined
                  }
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating…
                    </>
                  ) : isCurrent ? (
                    'Current plan'
                  ) : (
                    'Select plan'
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-[12px] text-muted-foreground">
        Billing launches with Stripe — keep using SeeIt for free until then. You
        can change your plan any time.
      </p>
    </>
  );
}
