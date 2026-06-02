import { TopBar } from '@/components/TopBar';
import { BulkUploadFlow } from './bulk-upload-flow';

export const dynamic = 'force-dynamic';

export default function BulkUploadPage() {
  return (
    <>
      <TopBar
        title="Bulk upload menu items"
        subtitle="Download the template, fill it in, then upload and review"
      />
      <div className="px-4 py-6 sm:px-8">
        <BulkUploadFlow />
      </div>
    </>
  );
}
