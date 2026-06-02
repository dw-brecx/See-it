'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  ReceiptText,
  Store,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Plan } from '@/lib/database.types';

type BrandBlock = {
  id: string;
  name: string;
  logo_url: string | null;
  plan: Plan | null;
  subscription_status: string | null;
  locations: { id: string; name: string; city: string | null; state: string | null }[];
};

type Props = {
  brands: BrandBlock[];
  defaultPerLocationCents: number;
};

function fmtCents(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function BillingSummary({ brands, defaultPerLocationCents }: Props) {
  if (brands.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <EmptyState
            icon={Store}
            title="No stores yet"
            description="You don't own any stores yet. Billing summaries will appear here once you add one."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {brands.map((b) => (
        <BrandBilling
          key={b.id}
          brand={b}
          defaultPerLocationCents={defaultPerLocationCents}
        />
      ))}
    </div>
  );
}

function BrandBilling({
  brand,
  defaultPerLocationCents,
}: {
  brand: BrandBlock;
  defaultPerLocationCents: number;
}) {
  const perLocationCents = brand.plan?.price_cents ?? defaultPerLocationCents;
  const interval = brand.plan?.billing_interval ?? 'month';
  const planName = brand.plan?.name ?? 'Starter (free trial)';
  const planFeatures = brand.plan?.features ?? [
    'Up to 1 location',
    'Menu, photos, reviews',
    'AI assistant (preview)',
    'Free until Stripe launch',
  ];
  const locationCount = brand.locations.length;
  const totalCents = perLocationCents * locationCount;
  const onTrial = !brand.plan;

  return (
    <div className="space-y-5">
      <BrandHeader brand={brand} />

      {/* Plan card */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Current plan
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <CardTitle className="text-[20px]">{planName}</CardTitle>
              {onTrial && (
                <Badge variant="primary">On free trial</Badge>
              )}
              {brand.subscription_status && !onTrial && (
                <Badge variant="default">{brand.subscription_status}</Badge>
              )}
            </div>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {fmtCents(perLocationCents)} / location / {interval} ·{' '}
              <span className="font-semibold text-foreground">
                {fmtCents(totalCents)}
              </span>{' '}
              for {locationCount} location{locationCount === 1 ? '' : 's'}
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline" className="gap-1.5">
              <Link href="/dashboard/billing/plans">
                Change plan
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <div className="relative inline-flex">
              <Button disabled className="gap-1.5">
                <CreditCard className="h-3.5 w-3.5" />
                Manage subscription
              </Button>
              <Badge
                variant="warning"
                className="absolute -top-2 -right-2 shadow-soft"
              >
                Coming soon
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-warm-100 bg-warm-25 p-4 text-[12.5px] text-warm-700">
            Billing launches with Stripe — keep using SeeIt for free until then.
          </div>
          {planFeatures.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {planFeatures.map((f, i) => (
                <li
                  key={`${f}-${i}`}
                  className="flex items-start gap-2 text-[13px] text-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Locations breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-terracotta-600" />
            Locations breakdown
          </CardTitle>
          <p className="text-[12.5px] text-muted-foreground">
            Per-location fee × number of locations.
          </p>
        </CardHeader>
        <CardContent className="px-0">
          {brand.locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations yet"
              description="Add your first location to start counting toward your plan."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Monthly fee</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brand.locations.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[l.city, l.state].filter(Boolean).join(', ') || '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fmtCents(perLocationCents)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-warm-25">
                  <TableCell colSpan={2} className="font-semibold">
                    Total / {interval}
                  </TableCell>
                  <TableCell className="text-right text-[15px] font-bold tabular-nums text-terracotta-700">
                    {fmtCents(totalCents)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ReceiptText className="h-4 w-4 text-terracotta-600" />
            Payment history
          </CardTitle>
          <p className="text-[12.5px] text-muted-foreground">
            Your past charges and receipts will appear here.
          </p>
        </CardHeader>
        <CardContent className="px-0">
          <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">
            No charges yet — billing launches with Stripe.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BrandHeader({ brand }: { brand: BrandBlock }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-warm-100 ring-1 ring-inset ring-warm-200">
        {brand.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Store className="h-4 w-4 text-warm-600" />
        )}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-[17px] font-semibold tracking-tight text-foreground">
          {brand.name}
        </h2>
        <p className="text-[12.5px] text-muted-foreground">Store billing</p>
      </div>
    </div>
  );
}
