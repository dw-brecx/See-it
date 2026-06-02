import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { BillingSummary } from './billing-summary';
import type { Plan } from '@/lib/database.types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_PER_LOCATION_CENTS = 5000; // $50

async function loadBilling() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find brands the user owns or is on a team for.
  const [ownedRes, teamRes] = await Promise.all([
    supabase
      .from('brands')
      .select(
        'id, name, plan_id, subscription_status, logo_url',
      )
      .eq('owner_id', user.id)
      .order('name'),
    supabase.from('team_members').select('brand_id, role').eq('user_id', user.id),
  ]);

  const owned = (ownedRes.data ?? []) as {
    id: string;
    name: string;
    plan_id: string | null;
    subscription_status: string | null;
    logo_url: string | null;
  }[];

  // For now: billing only covers brands the user actually owns.
  if (owned.length === 0) return { brands: [] };

  const brandIds = owned.map((b) => b.id);
  const planIds = Array.from(
    new Set(owned.map((b) => b.plan_id).filter((p): p is string => !!p)),
  );

  const [locsRes, plansRes] = await Promise.all([
    supabase
      .from('locations')
      .select('id, name, brand_id, city, state')
      .in('brand_id', brandIds)
      .order('name'),
    planIds.length > 0
      ? supabase.from('plans').select('*').in('id', planIds)
      : Promise.resolve({ data: [] as Plan[], error: null }),
  ]);

  const locations = (locsRes.data ?? []) as {
    id: string;
    name: string;
    brand_id: string;
    city: string | null;
    state: string | null;
  }[];
  const plans = (plansRes.data ?? []) as Plan[];
  const planById = new Map(plans.map((p) => [p.id, p]));

  const brands = owned.map((b) => ({
    id: b.id,
    name: b.name,
    logo_url: b.logo_url,
    plan: b.plan_id ? planById.get(b.plan_id) ?? null : null,
    subscription_status: b.subscription_status,
    locations: locations.filter((l) => l.brand_id === b.id),
  }));

  return { brands };
}

export default async function BillingPage() {
  const data = await loadBilling();
  if (!data) redirect('/signin');

  return (
    <>
      <TopBar
        title="Billing"
        subtitle="Your plan, locations, and what you'd pay when Stripe launches"
      />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <BillingSummary
          brands={data.brands}
          defaultPerLocationCents={DEFAULT_PER_LOCATION_CENTS}
        />
      </div>
    </>
  );
}
