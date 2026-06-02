import { TopBar } from '@/components/TopBar';
import { TeamList } from './team-list';

export const dynamic = 'force-dynamic';

export default function SettingsTeamPage() {
  return (
    <>
      <TopBar title="Team" subtitle="Manage who can edit this brand" />
      <TeamList />
    </>
  );
}
