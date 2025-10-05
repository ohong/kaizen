import type { ScatterPoint } from "@/lib/metrics";

import { DistributionChart, ScatterChartViz } from "@/components/charts";

interface WorkflowSignalsSectionProps {
  sizeVsTimeData: ScatterPoint[];
  reviewVsMergeData: ScatterPoint[];
  prSizeDistribution: { category: string; value: number; color: string }[];
}

export function WorkflowSignalsSection({
  sizeVsTimeData,
  reviewVsMergeData,
  prSizeDistribution,
}: WorkflowSignalsSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">
        Workflow signals
      </h2>
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className="h-[360px] hud-panel hud-corner p-4">
          <ScatterChartViz
            data={sizeVsTimeData}
            xLabel="PR size (additions + deletions)"
            yLabel="Time to merge"
            title="PR size vs merge time"
            xUnit=" lines"
            yUnit=" h"
          />
        </div>
        <div className="h-[360px] hud-panel hud-corner p-4">
          <ScatterChartViz
            data={reviewVsMergeData}
            xLabel="Time to first review"
            yLabel="Time to merge"
            title="Review responsiveness"
            xUnit=" h"
            yUnit=" h"
          />
        </div>
        <div className="h-[360px] hud-panel hud-corner p-4">
          <DistributionChart
            data={prSizeDistribution}
            title="PR size distribution"
            yLabel="Number of PRs"
          />
        </div>
      </div>
    </section>
  );
}
