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

  return (
    <section className={`h-full ${className ?? ""}`}>
      <div className="hud-panel hud-corner flex h-full flex-col p-6">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Team delivery health
          </p>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-semibold text-[var(--hud-text-bright)]">{summary.summary}</h2>
            <div
              className="text-right relative"
              onMouseEnter={() => setShowScoreTooltip(true)}
              onMouseLeave={() => setShowScoreTooltip(false)}
            >
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Velocity score
              </p>
              <p className={`text-4xl font-semibold ${scoreColor}`}>
                {summary.healthScore !== null ? summary.healthScore : "—"}
              </p>

              {showScoreTooltip && summary.healthScore !== null && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] p-3 shadow-lg">
                  <p className="text-xs font-semibold text-[var(--hud-text-bright)]">{scoreInterpretation}</p>
                  <p className="mt-2 text-xs text-[var(--hud-text)]">
                    This score reflects team velocity based on throughput and merge speed.
                  </p>
                  <div className="mt-2 border-t border-[var(--hud-border)] pt-2 text-[10px] text-[var(--hud-text-dim)]">
                    <p>Score ranges: 80-100 (Excellent), 60-79 (Good), 40-59 (Needs attention), 0-39 (Critical)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryStat
            label="Throughput / week"
            value={
              summary.throughputPerWeek !== null ? summary.throughputPerWeek.toFixed(1) : "—"
            }
            suffix=" PRs"
          />
          <SummaryStat
            label="Active contributors"
            value={formatInteger(summary.activeContributors)}
          />
          <SummaryStat label="Avg first review" value={formatHours(summary.avgTimeToFirstReview)} />
          <SummaryStat label="Avg merge time" value={formatHours(summary.avgMergeHours)} />
          <SummaryStat label="Merge rate" value={formatPercent(summary.mergeRate)} />
          <SummaryStat label="Small PR share" value={formatPercent(summary.smallPRShare)} />
        </div>

        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Open PR backlog
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {summary.backlogBuckets.map((bucket) => (
              <BacklogPill
                key={bucket.label}
                label={bucket.label}
                count={bucket.count}
                total={summary.openPrCount}
              />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  suffix?: string;
}

function SummaryStat({ label, value, suffix }: SummaryStatProps) {
  return (
    <div className="hud-panel hud-corner p-5">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-[var(--hud-text-bright)]">
        {value}
        {suffix ?? ""}
      </p>
    </div>
  );
}

interface BacklogPillProps {
  label: string;
  count: number;
  total: number;
}

function BacklogPill({ label, count, total }: BacklogPillProps) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="hud-panel hud-corner p-5">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--hud-text-bright)]">
        {formatInteger(count)}
      </p>
    </div>
  );
}
