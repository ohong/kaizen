import { type ReactNode, useState } from "react";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DistributionChart, ScatterChartViz, ComparisonBarChart } from "@/components/charts";
import type { ScatterPoint, ComparisonInsight } from "@/lib/metrics";
import type { DatadogError } from "@/lib/types/database";
import { resolveServiceName } from "@/lib/errors";

// Widget Props Interfaces
export interface ErrorsOverTimeWidgetProps {
  timeline: { date: string; count: number }[];
  loading: boolean;
}

export interface ServicesImpactedWidgetProps {
  byService: { category: string; value: number }[];
}

export interface EnvironmentSpreadWidgetProps {
  byEnv: { category: string; value: number }[];
}

export interface RecentErrorsWidgetProps {
  recent: DatadogError[];
  loading: boolean;
}

export interface TopErrorMessagesWidgetProps {
  topMessages: { message: string; count: number }[];
  loading: boolean;
}

export interface PRSizeVsTimeWidgetProps {
  sizeVsTimeData: ScatterPoint[];
}

export interface ReviewResponsivenessWidgetProps {
  reviewVsMergeData: ScatterPoint[];
}

export interface PRSizeDistributionWidgetProps {
  prSizeDistribution: { category: string; value: number; color: string }[];
}

export interface CycleTimeBenchmarkWidgetProps {
  speedData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
}

export interface QualityBenchmarkWidgetProps {
  qualityData: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
}

export interface BenchmarkInsightsWidgetProps {
  insights: ComparisonInsight[];
}

// Widget Components
export function ErrorsOverTimeWidget({ timeline, loading }: ErrorsOverTimeWidgetProps) {
  if (loading) {
    return <EmptyState label="Loading..." />;
  }

  if (timeline.length === 0) {
    return <EmptyState label="No errors in selected period" />;
  }

  return (
    <div className="h-[320px]">
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={timeline} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
            labelStyle={{ color: "#cbd5e1" }}
            itemStyle={{ color: "#cbd5e1" }}
            formatter={(value: number | string) => [value, "Errors"]}
          />
          <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ServicesImpactedWidget({ byService }: ServicesImpactedWidgetProps) {
  return (
    <div className="h-[320px]">
      <DistributionChart data={byService} title="By service" yLabel="Errors" />
    </div>
  );
}

export function EnvironmentSpreadWidget({ byEnv }: EnvironmentSpreadWidgetProps) {
  return (
    <div className="h-[320px]">
      <DistributionChart data={byEnv} title="By environment" yLabel="Errors" />
    </div>
  );
}

export function RecentErrorsWidget({ recent, loading }: RecentErrorsWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">Loading...</div>;
  }

  if (recent.length === 0) {
    return <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">No recent errors</div>;
  }

  const visibleErrors = showAll ? recent : recent.slice(0, 5);
  const remaining = Math.max(recent.length - visibleErrors.length, 0);

  return (
    <div className="mt-3 space-y-2">
      <ul className="divide-y divide-[var(--hud-border)]">
        {visibleErrors.map((e) => (
          <li key={e.id} className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="line-clamp-2 text-sm text-[var(--hud-text)]" title={e.message || "(no message)"}>
                  {e.message || "(no message)"}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone="danger">{e.status || "error"}</Badge>
                  <Badge tone="info">{resolveServiceName(e.service, e.id)}</Badge>
                  {e.env && <Badge tone="neutral">{e.env}</Badge>}
                </div>
              </div>
              <time className="whitespace-nowrap text-xs text-[var(--hud-text-dim)]">
                {new Date(e.occurred_at).toLocaleString()}
              </time>
            </div>
          </li>
        ))}
      </ul>

      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="w-full rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-accent)] transition-all duration-200 hover:border-[var(--hud-accent)] hover:bg-[var(--hud-accent)]/10"
        >
          Show {remaining} more error{remaining === 1 ? "" : "s"}
        </button>
      ) : showAll ? (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="w-full rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-accent)] transition-all duration-200 hover:border-[var(--hud-accent)] hover:bg-[var(--hud-accent)]/10"
        >
          Show fewer errors
        </button>
      ) : null}
    </div>
  );
}

export function TopErrorMessagesWidget({ topMessages, loading }: TopErrorMessagesWidgetProps) {
  if (loading) {
    return <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">Loading...</div>;
  }

  if (topMessages.length === 0) {
    return <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">No messages</div>;
  }

  return (
    <ol className="mt-3 space-y-2 text-sm text-[var(--hud-text)]">
      {topMessages.map((m, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="font-mono text-xs text-[var(--hud-text-dim)]">{i + 1}.</span>
          <div className="flex-1">
            <p className="line-clamp-2" title={m.message}>
              {m.message}
            </p>
            <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{m.count} occurrences</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PRSizeVsTimeWidget({ sizeVsTimeData }: PRSizeVsTimeWidgetProps) {
  return (
    <div className="h-[360px]">
      <ScatterChartViz
        data={sizeVsTimeData}
        xLabel="PR size (additions + deletions)"
        yLabel="Time to merge"
        title="PR size vs merge time"
        xUnit=" lines"
        yUnit=" h"
      />
    </div>
  );
}

export function ReviewResponsivenessWidget({ reviewVsMergeData }: ReviewResponsivenessWidgetProps) {
  return (
    <div className="h-[360px]">
      <ScatterChartViz
        data={reviewVsMergeData}
        xLabel="Time to first review"
        yLabel="Time to merge"
        title="Review responsiveness"
        xUnit=" h"
        yUnit=" h"
      />
    </div>
  );
}

export function PRSizeDistributionWidget({ prSizeDistribution }: PRSizeDistributionWidgetProps) {
  return (
    <div className="h-[360px]">
      <DistributionChart data={prSizeDistribution} title="PR size distribution" yLabel="Number of PRs" />
    </div>
  );
}

export function CycleTimeBenchmarkWidget({ speedData }: CycleTimeBenchmarkWidgetProps) {
  return (
    <div className="h-[380px]">
      <ComparisonBarChart
        data={speedData}
        title="Cycle time vs industry"
        yLabel="Hours"
        valueUnit=""
        lowerIsBetter
      />
    </div>
  );
}

export function QualityBenchmarkWidget({ qualityData }: QualityBenchmarkWidgetProps) {
  return (
    <div className="h-[380px]">
      <ComparisonBarChart data={qualityData} title="Quality signals vs industry" yLabel="Value" />
    </div>
  );
}

export function BenchmarkInsightsWidget({ insights }: BenchmarkInsightsWidgetProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {insights.map((insight) => (
        <InsightCard key={insight.metric} insight={insight} />
      ))}
    </div>
  );
}

// Helper Components
function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-[var(--hud-text-dim)]">{label}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "danger" | "info" | "neutral" }) {
  const color =
    tone === "danger"
      ? "text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10"
      : tone === "info"
        ? "text-[#3b82f6] border-[#3b82f6]/40 bg-[#3b82f6]/10"
        : "text-[var(--hud-text-dim)] border-[var(--hud-border)] bg-[var(--hud-bg)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${color}`}>
      {children}
    </span>
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
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">Your</p>
          <p className="mt-1 font-semibold text-[var(--hud-text-bright)]">{insight.yourValue.toFixed(1)}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">Median</p>
          <p className="mt-1">{insight.industryMedian.toFixed(1)}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">Top 10%</p>
          <p className="mt-1 text-[var(--hud-accent)]">{insight.industryTop10.toFixed(1)}</p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--hud-text)]">{insight.interpretation}</p>
    </div>
  );
}
