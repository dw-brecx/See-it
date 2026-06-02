import Link from 'next/link';
import { Eye } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { Button } from '@/components/ui/button';
import { ProfileForm } from './profile-form';

export const dynamic = 'force-dynamic';

export default function SettingsProfilePage() {
  return (
    <>
      <TopBar
        title="Brand profile"
        subtitle="Your storefront identity across the SeeIt app"
      >
        <Button asChild variant="outline" size="sm" className="h-9 gap-1.5">
          <Link href="/dashboard/preview">
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Preview</span>
          </Link>
        </Button>
      </TopBar>
      <ProfileForm />
    </>
  );
}
