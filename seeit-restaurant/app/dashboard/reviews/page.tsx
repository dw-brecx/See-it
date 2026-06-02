import { TopBar } from '@/components/TopBar';
import { ReviewsList } from './reviews-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ReviewsPage() {
  return (
    <>
      <TopBar
        title="Reviews"
        subtitle="What diners are saying about your locations"
      />
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6 sm:py-6">
        <ReviewsList />
      </div>
    </>
  );
}
