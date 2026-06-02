import { TopBar } from '@/components/TopBar';
import { AccountForm } from './account-form';

export const dynamic = 'force-dynamic';

export default function SettingsAccountPage() {
  return (
    <>
      <TopBar title="Account" subtitle="Your personal sign-in and profile" />
      <AccountForm />
    </>
  );
}
