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
      <div className="h-[420px] hud-panel hud-corner p-4">
        <ComparisonBarChart
          data={speedData}
          title="Cycle time vs industry"
          yLabel="Hours"
          valueUnit=""
          lowerIsBetter
        />
      </div>
      <div className="h-[420px] hud-panel hud-corner p-4">
        <ComparisonBarChart
          data={qualityData}
          title="Quality signals vs industry"
          yLabel="Value"
        />
      </div>
      {insights.length > 0 && (
        <div className="xl:col-span-2">
          <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">
            Benchmark insights
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {insights.map((insight) => (
              <InsightCard key={insight.metric} insight={insight} />
            ))}
          </div>
        </div>
      )}
    </section>
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
