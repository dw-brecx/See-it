import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/DashboardShell';
import { getUserBrand } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, role')
    .eq('id', authUser.id)
    .maybeSingle();
  if (!profile) redirect('/signin');

  // SeeIt model: every restaurant_owner works under exactly one brand
  // (their owned brand, or — if they don't own one — the team they belong to).
  // Admins are exempt; they have no specific brand context here.
  const myBrand = await getUserBrand(supabase, authUser.id);

  if (!myBrand && profile.role !== 'admin') {
    redirect('/onboarding');
  }

  const brands = myBrand
    ? [
        {
          id: myBrand.id,
          name: myBrand.name,
          logo_url: myBrand.logo_url,
          plan: myBrand.plan,
        },
      ]
    : [];

  let locations: { id: string; name: string; city: string | null; brand_id: string }[] = [];
  if (myBrand) {
    const { data } = await supabase
      .from('locations')
      .select('id, name, city, brand_id')
      .eq('brand_id', myBrand.id)
      .order('name', { ascending: true });
    locations = (data ?? []) as any;
  }

  return (
    <DashboardShell
      user={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
      }}
      brands={brands}
      locations={locations}
    >
      {children}
    </DashboardShell>
  );
}
