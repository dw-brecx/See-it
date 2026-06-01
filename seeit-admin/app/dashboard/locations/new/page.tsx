import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent } from '@/components/ui/card';
import { BrandPicker } from './brand-picker';

export const dynamic = 'force-dynamic';

async function fetchBrands() {
  const supabase = createClient();
  const { data } = await supabase
    .from('brands')
    .select('id, name, logo_url, primary_cuisine')
    .order('name', { ascending: true })
    .limit(500);
  return (data ?? []) as { id: string; name: string; logo_url: string | null; primary_cuisine: string | null }[];
}

export default async function NewLocationPage() {
  const brands = await fetchBrands();
  return (
    <>
      <TopBar title="Add location" subtitle="Pick a brand to attach this location to" />
      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <Link
          href="/dashboard/locations"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All locations
        </Link>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <BrandPicker brands={brands} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
