'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/signin');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-out failed';
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleSignOut}
      variant="ghost"
      disabled={loading}
      className="w-full justify-start gap-2.5 px-2.5 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-[18px] w-[18px]" />
      {loading ? 'Signing out…' : 'Sign out'}
    </Button>
  );
}
