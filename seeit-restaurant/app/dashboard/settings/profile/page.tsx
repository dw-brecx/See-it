import { TopBar } from '@/components/TopBar';
import { ProfileForm } from './profile-form';

export const dynamic = 'force-dynamic';

export default function SettingsProfilePage() {
  return (
    <>
      <TopBar
        title="Brand profile"
        subtitle="Your storefront identity across the SeeIt app"
      />
      <ProfileForm />
    </>
  );
}
