import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TopBar } from '@/components/TopBar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
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

  return (
    <>
      <TopBar title="Settings" subtitle="Your admin profile" />
      <div className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
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
        </div>
      </div>
    </>
  );
}
