import { TopBar } from '@/components/TopBar';
import { RecommendationsList } from './recommendations-list';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AIAssistantPage() {
  return (
    <>
      <TopBar
        title="AI assistant"
        subtitle="Listing health and personalized recommendations"
      />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <RecommendationsList />
      </div>
    </>
  );
}
