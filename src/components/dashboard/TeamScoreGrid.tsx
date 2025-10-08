"use client";

import { useState } from "react";
import type { TeamEfficiencySummary } from "@/lib/metrics";
import { getScoreColor, getScoreInterpretation } from "@/lib/score-colors";

interface TeamScoreGridProps {
  summary: TeamEfficiencySummary | null;
  className?: string;
}

export function TeamScoreGrid({ summary, className }: TeamScoreGridProps) {
  const metrics =
    summary === null
      ? []
      : [
          { title: "Velocity", score: summary?.velocity },
          { title: "Quality", score: summary?.quality },
          { title: "Collaboration", score: summary?.collaboration },
          { title: "Consistency", score: summary?.consistency },
        ].filter((entry): entry is { title: string; score: TeamEfficiencySummary["velocity"] } => Boolean(entry.score));

  if (!metrics.length) {
    return null;
  }

  return (
    <section className={`hud-panel hud-corner flex h-full flex-col p-6 transition-transform duration-200 hover:-translate-y-1 ${className ?? ""}`}>
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
        Team performance lenses
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {metrics.map((metric) => (
          <ScoreCard key={metric.title} title={metric.title} score={metric.score} />
        ))}
      </div>
    </section>
  );
}

interface ScoreCardProps {
  title: string;
  score: TeamEfficiencySummary["velocity"];
}

function ScoreCard({ title, score }: ScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const displayScore = Math.round(score.score);
  const scoreColor = getScoreColor(displayScore);
  const interpretation = getScoreInterpretation(displayScore);

  return (
    <div
      className="hud-panel hud-corner relative flex h-full flex-col p-3 transition-transform duration-200 hover:-translate-y-1"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ zIndex: showTooltip ? 20 : "auto" }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">{title}</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
          Team score
        </span>
      </div>
      <span className={`mt-2 text-4xl font-semibold ${scoreColor}`}>
        {displayScore}
      </span>

      {showTooltip && (
        <div className="pointer-events-none absolute left-0 right-0 top-full z-50 mt-2 w-full rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] p-3 shadow-lg">
          <p className="text-xs font-semibold text-[var(--hud-text-bright)]">{interpretation}</p>
          {score.interpretation && (
            <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{score.interpretation}</p>
          )}
          {score.recommendation && (
            <p className="mt-2 text-xs text-[var(--hud-text)]">{score.recommendation}</p>
          )}
          <div className="mt-2 border-t border-[var(--hud-border)] pt-2 text-[10px] text-[var(--hud-text-dim)]">
            <p>Score ranges: 80-100 (Excellent), 60-79 (Good), 40-59 (Needs attention), 0-39 (Critical)</p>
          </div>
        </div>
      )}
    </div>
  );
}
