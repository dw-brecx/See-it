import { TopBar } from '@/components/TopBar';
import { IntegrationsForm } from './integrations-form';

export const dynamic = 'force-dynamic';

export default function SettingsIntegrationsPage() {
  return (
    <>
      <TopBar
        title="Integrations"
        subtitle="Connect external services to enrich your listing"
      />
      <IntegrationsForm />
    </>
  );
}
