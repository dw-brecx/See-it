import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Defense in depth: middleware also enforces this, but never trust just one layer.
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect('/signin');

  const { data: profile, error } = await supabase
    .from('users')
    .select('id, name, email, avatar_url, role')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error || !profile || profile.role !== 'admin') {
    await supabase.auth.signOut();
    redirect('/signin?error=not_admin');
  }

  return (
    <DashboardShell
      user={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        avatar_url: profile.avatar_url,
      }}
    >
      {children}
    </DashboardShell>
  );
}
