import { TopBar } from '@/components/TopBar';
import { PhotosGallery } from './photos-gallery';

export const dynamic = 'force-dynamic';

export default function PhotosPage() {
  return (
    <>
      <TopBar
        title="Photos"
        subtitle="Restaurant and customer photos of your dishes"
      />
      <div className="px-4 py-6 sm:px-8">
        <PhotosGallery />
      </div>
    </>
  );
}
