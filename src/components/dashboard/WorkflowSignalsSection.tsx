import type { ReactNode } from "react";

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
        <ChartPanel
          title="PR size vs merge time"
          description={
            sizeVsTimeData.length
              ? `${sizeVsTimeData.length} merged PRs plotted. Look for outliers when expanded.`
              : "Expand to view once we have merged PR data."
          }
        >
          <ScatterChartViz
            data={sizeVsTimeData}
            xLabel="PR size (additions + deletions)"
            yLabel="Time to merge"
            title="PR size vs merge time"
            xUnit=" lines"
            yUnit=" h"
          />
        </ChartPanel>
        <ChartPanel
          title="Review responsiveness"
          description={
            reviewVsMergeData.length
              ? `${reviewVsMergeData.length} PRs show review latency vs merge time.`
              : "Expand to explore once review data is available."
          }
        >
          <ScatterChartViz
            data={reviewVsMergeData}
            xLabel="Time to first review"
            yLabel="Time to merge"
            title="Review responsiveness"
            xUnit=" h"
            yUnit=" h"
          />
        </ChartPanel>
        <ChartPanel
          title="PR size distribution"
          description="See how work is split across small, medium, and large PRs."
        >
          <DistributionChart
            data={prSizeDistribution}
            title="PR size distribution"
            yLabel="Number of PRs"
          />
        </ChartPanel>
      </div>
    </section>
  );
}

function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="hud-panel hud-corner p-3">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-[var(--hud-text)] transition-colors group-open:bg-[var(--hud-bg-elevated)]">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">{title}</span>
            <span className="text-sm text-[var(--hud-text)]">{description}</span>
          </div>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
        </summary>
        <div className="mt-4 h-[360px]">
          {children}
        </div>
      </details>
    </div>
  );
}
