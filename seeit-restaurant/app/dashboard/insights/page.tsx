import { TopBar } from '@/components/TopBar';
import { InsightsCharts } from './insights-charts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function InsightsPage() {
  return (
    <>
      <TopBar
        title="Insights"
        subtitle="How your restaurant is performing on SeeIt"
      />
      <div className="flex-1 space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <InsightsCharts />
      </div>
    </>
  );
}
