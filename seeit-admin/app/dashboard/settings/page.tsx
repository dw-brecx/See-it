import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsForm } from './settings-form';
import { PlansPanel } from './plans-panel';
import { DiscountCodesPanel } from './discount-codes-panel';

export const dynamic = 'force-dynamic';

async function fetchData() {
  const supabase = createClient();
  // Plans + codes might not exist yet if the user hasn't run the migration —
  // tolerate the error and fall back to empty arrays so the page still loads.
  const [plansRes, codesRes] = await Promise.all([
    supabase
      .from('plans')
      .select('*')
      .order('display_order', { ascending: true })
      .order('price_cents', { ascending: true }),
    supabase
      .from('discount_codes')
      .select('*, applies_to_plan:plans(name)')
      .order('created_at', { ascending: false }),
  ]);
  return {
    plans: (plansRes.data ?? []) as any[],
    plansMissing: plansRes.error?.code === '42P01',
    codes: (codesRes.data ?? []) as any[],
    codesMissing: codesRes.error?.code === '42P01',
  };
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect('/signin');

  const { data: profile } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, phone, role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (!profile) redirect('/signin');

  const { plans, plansMissing, codes, codesMissing } = await fetchData();

  const initialTab = ['profile', 'plans', 'codes'].includes(searchParams.tab ?? '')
    ? searchParams.tab!
    : 'profile';

  return (
    <>
      <TopBar title="Settings" subtitle="Profile, plans, and discount codes" />
      <div className="flex-1 px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto w-full max-w-4xl">
          <Tabs defaultValue={initialTab} className="space-y-5">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="codes">Discount codes</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>
                    Update your name, avatar, and password. Email is read-only.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SettingsForm
                    profile={{
                      id: profile.id,
                      name: profile.name,
                      email: profile.email,
                      avatar_url: profile.avatar_url,
                      phone: profile.phone,
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-5">
              {plansMissing ? (
                <MigrationNeeded entity="plans" />
              ) : (
                <PlansPanel plans={plans} />
              )}
            </TabsContent>

            <TabsContent value="codes" className="space-y-5">
              {codesMissing ? (
                <MigrationNeeded entity="discount_codes" />
              ) : (
                <DiscountCodesPanel codes={codes} plans={plans} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

function MigrationNeeded({ entity }: { entity: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database migration required</CardTitle>
        <CardDescription>
          The <code className="rounded bg-warm-100 px-1.5 py-0.5 text-[12px]">{entity}</code>{' '}
          table doesn't exist yet. Run the SQL in{' '}
          <code className="rounded bg-warm-100 px-1.5 py-0.5 text-[12px]">
            seeit-admin/migrations/001_plans_and_discount_codes.sql
          </code>{' '}
          in your Supabase SQL editor, then refresh this page.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
