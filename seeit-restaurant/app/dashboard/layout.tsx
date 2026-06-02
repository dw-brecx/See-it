import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/DashboardShell';

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

  // Find brands the user owns OR is a team member on.
  const [ownedRes, teamRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id, name, logo_url')
      .eq('owner_id', authUser.id)
      .order('name', { ascending: true }),
    supabase
      .from('team_members')
      .select('brand:brands(id, name, logo_url)')
      .eq('user_id', authUser.id),
  ]);

  const owned = (ownedRes.data ?? []) as { id: string; name: string; logo_url: string | null }[];
  const teamBrands = ((teamRes.data ?? []) as any[])
    .map((r) => r.brand)
    .filter((b): b is { id: string; name: string; logo_url: string | null } => !!b);

  // De-dup
  const brandMap = new Map<string, { id: string; name: string; logo_url: string | null }>();
  for (const b of [...owned, ...teamBrands]) brandMap.set(b.id, b);
  const brands = Array.from(brandMap.values());

  // No brand → straight to onboarding (admins are exempt — they can browse without one)
  if (brands.length === 0 && profile.role !== 'admin') {
    redirect('/onboarding');
  }

  // Fetch locations across all accessible brands
  const brandIds = brands.map((b) => b.id);
  let locations: { id: string; name: string; city: string | null; brand_id: string }[] = [];
  if (brandIds.length > 0) {
    const { data } = await supabase
      .from('locations')
      .select('id, name, city, brand_id')
      .in('brand_id', brandIds)
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
