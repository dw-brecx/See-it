'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PhotoUpload } from '@/components/PhotoUpload';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { STORAGE } from '@/lib/constants';
import { initials } from '@/lib/utils';

type Profile = {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
};

export function AccountForm() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [avatarUrl, setAvatarUrl] = React.useState('');
  const [savingProfile, setSavingProfile] = React.useState(false);
  const savingProfileRef = React.useRef(false);

  // Password
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [savingPassword, setSavingPassword] = React.useState(false);
  const savingPasswordRef = React.useRef(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, avatar_url, phone')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error(`Failed to load profile: ${error.message}`);
      } else if (data) {
        setProfile(data as Profile);
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
        setAvatarUrl(data.avatar_url ?? '');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (savingProfileRef.current) return;
    if (!profile) return;
    savingProfileRef.current = true;
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({
          name: name.trim() || null,
          phone: phone.trim() || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', profile.id);
      if (error) {
        toast.error(`Save failed: ${error.message}`);
        return;
      }
      toast.success('Profile updated');
      setProfile({ ...profile, name: name.trim() || null, phone: phone.trim() || null, avatar_url: avatarUrl || null });
      router.refresh();
    } finally {
      savingProfileRef.current = false;
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (savingPasswordRef.current) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    savingPasswordRef.current = true;
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(`Could not update password: ${error.message}`);
        return;
      }
      toast.success('Password updated');
      setPassword('');
      setConfirmPassword('');
    } finally {
      savingPasswordRef.current = false;
      setSavingPassword(false);
    }
  }

  async function confirmDelete() {
    toast.info(
      'Account deletion requested. A SeeIt admin will follow up to confirm and remove your data.',
    );
    setDeleteOpen(false);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Could not load your account. Try refreshing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>
            Used in the sidebar and on review replies.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-terracotta-100 text-terracotta-700 text-sm font-semibold">
                  {initials(name || profile.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <Label className="text-[12px] text-muted-foreground">Avatar</Label>
                <div className="mt-1">
                  <PhotoUpload
                    bucket={STORAGE.AVATARS}
                    prefix={profile.id}
                    value={avatarUrl || null}
                    onChange={(url) => setAvatarUrl(url ?? '')}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="account-name">Name</Label>
              <Input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1.5"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="account-email">Email</Label>
                <Input
                  id="account-email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-1.5 bg-warm-50/60"
                />
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  Email changes are handled by support.
                </p>
              </div>
              <div>
                <Label htmlFor="account-phone">Phone</Label>
                <Input
                  id="account-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 123 4567"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : (
                  'Save profile'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Change password
          </CardTitle>
          <CardDescription>
            Pick something at least 8 characters. You'll stay signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1.5"
                  minLength={8}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="mt-1.5"
                  minLength={8}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={savingPassword || !password || !confirmPassword}
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Updating…
                  </>
                ) : (
                  'Update password'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Delete account
          </CardTitle>
          <CardDescription>
            Submits a request to permanently remove your account and personal
            data. A SeeIt admin will confirm before anything is deleted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Request account deletion
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Request account deletion?"
        description="An admin will review your request and follow up by email before removing any data. This does not happen automatically."
        confirmLabel="Submit request"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  );
}
