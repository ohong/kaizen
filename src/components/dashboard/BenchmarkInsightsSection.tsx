import type { ReactNode } from "react";

import type { ComparisonInsight } from "@/lib/metrics";

import { ComparisonBarChart } from "@/components/charts";

interface BenchmarkInsightsSectionProps {
  speedData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  qualityData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  insights: ComparisonInsight[];
}

export function BenchmarkInsightsSection({ speedData, qualityData, insights }: BenchmarkInsightsSectionProps) {
  return (
    <section className="grid gap-6 xl:grid-cols-2">
      <ExpandablePanel
        title="Cycle time vs industry"
        description={
          speedData.length
            ? `Compare your merge and review speed to industry medians across ${speedData.length} metrics.`
            : "Expand to view benchmarked cycle-time metrics."
        }
      >
        <div className="h-[380px]">
          <ComparisonBarChart
            data={speedData}
            title="Cycle time vs industry"
            yLabel="Hours"
            valueUnit=""
            lowerIsBetter
          />
        </div>
      </ExpandablePanel>

      <ExpandablePanel
        title="Quality signals vs industry"
        description={
          qualityData.length
            ? `Stack your quality indicators against benchmarks across ${qualityData.length} measures.`
            : "Expand to explore quality benchmarks."
        }
      >
        <div className="h-[380px]">
          <ComparisonBarChart
            data={qualityData}
            title="Quality signals vs industry"
            yLabel="Value"
          />
        </div>
      </ExpandablePanel>

      {insights.length > 0 && (
        <div className="xl:col-span-2">
          <ExpandablePanel
            title="Benchmark insights"
            description="Key callouts on where you lead or lag. Expand for metric-level commentary."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {insights.map((insight) => (
                <InsightCard key={insight.metric} insight={insight} />
              ))}
            </div>
          </ExpandablePanel>
        </div>
      )}
    </section>
  );
}

function ExpandablePanel({
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
        <div className="mt-4">{children}</div>
      </details>
    </div>
  );
}

function InsightCard({ insight }: { insight: ComparisonInsight }) {
  return (
    <div className="hud-panel hud-corner p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-[var(--hud-text-bright)]">{insight.metric}</h3>
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)]">
          {insight.percentile}th pct
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-[var(--hud-text)]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Your
          </p>
          <p className="mt-1 font-semibold text-[var(--hud-text-bright)]">
            {insight.yourValue.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Median
          </p>
          <p className="mt-1">{insight.industryMedian.toFixed(1)}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Top 10%
          </p>
          <p className="mt-1 text-[var(--hud-accent)]">{insight.industryTop10.toFixed(1)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--hud-text)]">{insight.interpretation}</p>
    </div>
  );
}
