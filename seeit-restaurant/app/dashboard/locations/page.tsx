import { TopBar } from '@/components/TopBar';
import { LocationsList } from './locations-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LocationsPage() {
  return (
    <>
      <TopBar
        title="Locations"
        subtitle="Manage every storefront for the selected brand"
      />
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <LocationsList />
      </div>
    </>
  );
}
