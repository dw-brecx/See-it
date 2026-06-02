import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from './onboarding-wizard';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  // If this user already owns a brand (or is a team member on one),
  // skip onboarding — send them straight to the dashboard.
  const [ownedRes, teamRes] = await Promise.all([
    supabase
      .from('brands')
      .select('id', { head: false })
      .eq('owner_id', user.id)
      .limit(1),
    supabase
      .from('team_members')
      .select('id', { head: false })
      .eq('user_id', user.id)
      .limit(1),
  ]);
  const hasBrand =
    (ownedRes.data?.length ?? 0) > 0 || (teamRes.data?.length ?? 0) > 0;
  if (hasBrand) redirect('/dashboard');

  return <OnboardingWizard userId={user.id} />;
}
