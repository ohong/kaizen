import type { ComparisonInsight } from "@/lib/metrics";
import { BenchmarkSummary } from "@/components/dashboard/BenchmarkSummary";

interface WidgetizedBenchmarksSectionProps {
  speedData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  qualityData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  insights: ComparisonInsight[];
}

export function WidgetizedBenchmarksSection({
  speedData,
  qualityData,
  insights,
}: WidgetizedBenchmarksSectionProps) {
  return (
    <BenchmarkSummary
      speedData={speedData}
      qualityData={qualityData}
      insights={insights}
    />
  );
}
