'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { initials } from '@/lib/utils';

type Profile = {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
  phone: string | null;
};

const AVATAR_BUCKET = 'avatars';

export function SettingsForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5 MB');
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      toast.error(`Upload failed: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    setAvatarUrl(publicUrl.publicUrl);
    toast.success('Avatar uploaded — remember to save your profile');
    setUploading(false);
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({
        name: name.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq('id', profile.id);
    setSavingProfile(false);

    if (error) {
      toast.error(`Could not save profile: ${error.message}`);
      return;
    }
    toast.success('Profile saved');
    router.refresh();
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);

    if (error) {
      toast.error(`Could not change password: ${error.message}`);
      return;
    }
    toast.success('Password updated');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="space-y-8">
      <form onSubmit={saveProfile} className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarUrl || undefined} alt={name} />
            <AvatarFallback className="text-lg">
              {initials(name || profile.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label className="cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadAvatar}
                disabled={uploading}
                className="sr-only"
              />
              <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" /> Change photo
                  </>
                )}
              </span>
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              PNG, JPEG, or WebP · max 5 MB
            </p>
          </div>
        </div>

        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5"
            disabled={savingProfile}
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            readOnly
            disabled
            className="mt-1.5 bg-muted/40"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Email can't be changed from this dashboard. Contact platform owner if needed.
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1.5"
            disabled={savingProfile}
            placeholder="(415) 555-0142"
          />
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

      <hr />

      <form onSubmit={changePassword} className="space-y-5">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
          <p className="text-xs text-muted-foreground">
            You'll need to sign in again on other devices.
          </p>
        </div>
        <div>
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5"
            disabled={savingPassword}
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1.5"
            disabled={savingPassword}
            autoComplete="new-password"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
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
    </div>
  );
}
