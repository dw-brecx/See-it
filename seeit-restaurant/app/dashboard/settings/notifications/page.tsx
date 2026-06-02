import { TopBar } from '@/components/TopBar';
import { NotificationsForm } from './notifications-form';

export const dynamic = 'force-dynamic';

export default function SettingsNotificationsPage() {
  return (
    <>
      <TopBar
        title="Notifications"
        subtitle="Choose what you'd like to be alerted about"
      />
      <NotificationsForm />
    </>
  );
}
