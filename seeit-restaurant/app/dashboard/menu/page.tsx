import { TopBar } from '@/components/TopBar';
import { MenuManager } from './menu-manager';

export const dynamic = 'force-dynamic';

export default function MenuPage() {
  return (
    <>
      <TopBar
        title="Menu"
        subtitle="Manage categories, dishes, and photos per location"
      />
      <div className="px-4 py-6 sm:px-8">
        <MenuManager />
      </div>
    </>
  );
}
