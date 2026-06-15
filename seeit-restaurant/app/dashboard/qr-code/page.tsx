import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBrand } from '@/lib/auth';
import { TopBar } from '@/components/TopBar';
import { QrCodeClient } from './qr-code-client';

export const dynamic = 'force-dynamic';

export default async function QrCodePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const brand = await getUserBrand(supabase, user.id);
  if (!brand) redirect('/onboarding');

  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, address, city, state')
    .eq('brand_id', brand.id)
    .order('name', { ascending: true });

  return (
    <>
      <TopBar
        title="QR Code"
        subtitle="Print and place at your tables, counter, or window"
      />
      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <QrCodeClient
          brand={{
            id: brand.id,
            name: brand.name,
            logo_url: brand.logo_url ?? null,
            tagline: (brand as any).tagline ?? null,
          }}
          locations={(locations ?? []).map((l: any) => ({
            id: l.id,
            name: l.name,
            address: [l.address, l.city, l.state].filter(Boolean).join(', '),
          }))}
        />
      </div>
    </>
  );
}
