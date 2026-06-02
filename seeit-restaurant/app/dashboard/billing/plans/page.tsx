import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { PlansGrid } from './plans-grid';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PlansPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const [profileRes, plansRes, ownedRes] = await Promise.all([
    supabase
      .from('users')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('brands')
      .select('id, name, plan_id, logo_url')
      .eq('owner_id', user.id)
      .order('name'),
  ]);

  const profile = profileRes.data;
  const plans = plansRes.data ?? [];
  const ownedBrands = ownedRes.data ?? [];
  const isAdmin = profile?.role === 'admin';

  return (
    <>
      <TopBar
        title="Plans"
        subtitle="Pick the tier that fits your business"
      />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <PlansGrid
          plans={plans}
          ownedBrands={ownedBrands as any}
          isAdmin={!!isAdmin}
        />
      </div>
    </>
  );
}
