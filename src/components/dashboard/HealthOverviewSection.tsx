"use client";

import { useState } from "react";
import type { HealthSummary } from "@/lib/dashboard";
import { formatHours, formatInteger, formatPercent } from "@/lib/format";
import { getScoreColor, getScoreInterpretation } from "@/lib/score-colors";

interface HealthOverviewSectionProps {
  summary: HealthSummary;
  className?: string;
}

export function HealthOverviewSection({ summary, className }: HealthOverviewSectionProps) {
  const [showScoreTooltip, setShowScoreTooltip] = useState(false);
  const scoreColor = getScoreColor(summary.healthScore);
  const scoreInterpretation = getScoreInterpretation(summary.healthScore);

  const statCards: Array<StatCardEntry> = [];

  if (summary.throughputPerWeek !== null) {
    statCards.push({
      key: "throughput",
      label: "Throughput / week",
      value: `${summary.throughputPerWeek.toFixed(1)} PRs`,
    });
  }
  if (summary.activeContributors !== null && summary.activeContributors !== undefined) {
    statCards.push({
      key: "contributors",
      label: "Active contributors",
      value: formatInteger(summary.activeContributors),
    });
  }
  if (summary.avgTimeToFirstReview !== null && summary.avgTimeToFirstReview !== undefined) {
    statCards.push({
      key: "first-review",
      label: "Avg first review",
      value: formatHours(summary.avgTimeToFirstReview),
    });
  }
  if (summary.avgMergeHours !== null && summary.avgMergeHours !== undefined) {
    statCards.push({
      key: "merge-time",
      label: "Avg merge time",
      value: formatHours(summary.avgMergeHours),
    });
  }
  if (summary.mergeRate !== null) {
    statCards.push({
      key: "merge-rate",
      label: "Merge rate",
      value: formatPercent(summary.mergeRate),
      progress: summary.mergeRate,
    });
  }
  if (summary.smallPRShare !== null) {
    statCards.push({
      key: "small-pr",
      label: "Small PR share",
      value: formatPercent(summary.smallPRShare),
      progress: summary.smallPRShare,
    });
  }

  const backlogEntries = summary.backlogBuckets
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => {
      const percentage = summary.openPrCount > 0 ? Math.round((bucket.count / summary.openPrCount) * 100) : 0;

      return {
        key: `backlog-${bucket.label}`,
        label: `Backlog · ${bucket.label}`,
        value: formatInteger(bucket.count),
        meta: `${percentage}%`,
        progress: percentage,
        tone: bucket.label.includes("Stale") || bucket.label.includes(">7") ? "danger" : "info",
      } satisfies StatCardEntry;
    });

  const cardsToRender = [...statCards, ...backlogEntries];

  return (
    <section className={`h-full ${className ?? ""}`}>
      <div className="hud-panel-elevated hud-corner flex h-full flex-col gap-6 p-6 transition-transform duration-200 hover:-translate-y-1 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${summary.healthScore !== null && summary.healthScore >= 60 ? "bg-[var(--hud-success)]" : summary.healthScore !== null && summary.healthScore >= 40 ? "bg-[var(--hud-warning)]" : "bg-[var(--hud-danger)]"}`} />
              <span className="hud-badge">Team Delivery Health</span>
            </div>
            <h2 className="text-2xl font-semibold leading-snug text-[var(--hud-text-bright)]">
              {summary.summary}
            </h2>
            <p className="text-sm text-[var(--hud-text-dim)]">
              {summary.healthPercentile !== null
                ? `Velocity sits in the ${summary.healthPercentile}th percentile across repositories in Kaizen.`
                : "Velocity percentile will populate after the first benchmarking sync."}
            </p>
            <div className="flex flex-wrap gap-3">
              <SignalChip label="Open PRs" value={formatInteger(summary.openPrCount)} />
              <SignalChip label="Stale >3d" value={formatInteger(summary.stalePrCount)} tone={summary.stalePrCount > 0 ? "danger" : "default"} />
            </div>
          </div>

          <div
            className="relative flex w-full max-w-[240px] flex-col items-end gap-2 rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg)] px-5 py-4 shadow-[var(--shadow-medium)]"
            onMouseEnter={() => setShowScoreTooltip(true)}
            onMouseLeave={() => setShowScoreTooltip(false)}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
              Velocity score
            </p>
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {summary.healthScore !== null ? summary.healthScore : "—"}
            </p>
            {summary.healthPercentile !== null && (
              <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
                {summary.healthPercentile}th percentile
              </p>
            )}

            {showScoreTooltip && summary.healthScore !== null && (
              <div className="pointer-events-none absolute right-0 top-full z-50 mt-3 w-72 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-highest)] p-4 shadow-[var(--shadow-large)]">
                <div className="mb-2 flex items-center gap-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${summary.healthScore >= 60 ? "bg-[var(--hud-success)]" : summary.healthScore >= 40 ? "bg-[var(--hud-warning)]" : "bg-[var(--hud-danger)]"}`} />
                  <p className="text-xs font-semibold text-[var(--hud-text-bright)]">{scoreInterpretation}</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--hud-text)]">
                  Weighted blend of merge speed, first review response, and weekly throughput.
                </p>
                <div className="mt-3 border-t border-[var(--hud-border)] pt-3 text-[10px] text-[var(--hud-text-dim)] space-y-1">
                  <p>• <span className="text-[var(--hud-success)]">80-100</span>: Excellent</p>
                  <p>• <span className="text-[var(--hud-info)]">60-79</span>: Good</p>
                  <p>• <span className="text-[var(--hud-warning)]">40-59</span>: Needs focus</p>
                  <p>• <span className="text-[var(--hud-danger)]">0-39</span>: Critical</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {cardsToRender.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {cardsToRender.map((card) => (
              <StatCard key={card.key} entry={card} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

interface StatCardEntry {
  key: string;
  label: string;
  value: string;
  meta?: string;
  progress?: number | null;
  tone?: "danger" | "info" | "default";
}

function StatCard({ entry }: { entry: StatCardEntry }) {
  const numericProgress = entry.progress ?? null;
  const showProgress = numericProgress !== null && !Number.isNaN(numericProgress);
  const width = showProgress ? Math.min(Math.max(numericProgress, 0), 100) : 0;
  const toneClass = entry.tone === "danger" ? "text-[var(--hud-danger)]" : entry.tone === "info" ? "text-[var(--hud-info)]" : "text-[var(--hud-text-dim)]";

  return (
    <div className="hud-panel hud-corner flex min-h-[120px] flex-col justify-between rounded-xl p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-medium)]">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
            {entry.label}
          </span>
          {entry.meta && <span className={`font-mono text-[10px] uppercase tracking-[0.3em] ${toneClass}`}>{entry.meta}</span>}
        </div>
        <p className="text-2xl font-semibold text-[var(--hud-text-bright)]">{entry.value}</p>
      </div>

      {showProgress && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--hud-border)]">
          <div
            className={`h-full rounded-full ${entry.tone === "danger" ? "bg-[var(--hud-danger)]" : "bg-[var(--hud-accent)]"}`}
            style={{ width: `${width}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SignalChip({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  const toneClass = tone === "danger" ? "text-[var(--hud-danger)] border-[var(--hud-danger)]/50" : "text-[var(--hud-text-dim)] border-[var(--hud-border)]";

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] ${toneClass}`}>
      <span>{label}</span>
      <span className="text-[var(--hud-text-bright)]">{value}</span>
    </span>
  );
}
