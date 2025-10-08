"use client";

import { useState } from "react";
import type { TeamEfficiencySummary } from "@/lib/metrics";
import { getScoreColor, getScoreInterpretation } from "@/lib/score-colors";

interface TeamScoreGridProps {
  summary: TeamEfficiencySummary | null;
  className?: string;
}

export function TeamScoreGrid({ summary, className }: TeamScoreGridProps) {
  return (
    <section className={`hud-panel hud-corner flex h-full flex-col p-6 ${className ?? ""}`}>
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
        Team performance lenses
      </p>

      <div className="mt-4 flex flex-col gap-2">
        <ScoreCard title="Velocity" score={summary?.velocity} fallback="Gathering data from PR throughput" />
        <ScoreCard title="Quality" score={summary?.quality} fallback="Waiting for stable quality signals" />
        <ScoreCard
          title="Collaboration"
          score={summary?.collaboration}
          fallback="We'll show collaboration once review data lands"
        />
        <ScoreCard title="Consistency" score={summary?.consistency} fallback="Need more activity history" />
      </div>
    </section>
  );
}

interface ScoreCardProps {
  title: string;
  score: TeamEfficiencySummary["velocity"] | null | undefined;
  fallback: string;
}

function ScoreCard({ title, score, fallback }: ScoreCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isReady = Boolean(score);
  const displayScore = score ? Math.round(score.score) : null;
  const scoreColor = getScoreColor(displayScore);
  const interpretation = getScoreInterpretation(displayScore);

  return (
    <div
      className="hud-panel hud-corner flex h-full flex-col p-3 relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">{title}</span>
        {isReady && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Team score
          </span>
        )}
      </div>
      <span className={`mt-2 text-4xl font-semibold ${scoreColor}`}>
        {displayScore !== null ? displayScore : "—"}
      </span>
      {!isReady && <p className="mt-2 text-xs text-[var(--hud-text-dim)]">{fallback}</p>}

      {showTooltip && isReady && (
        <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] p-3 shadow-lg">
          <p className="text-xs font-semibold text-[var(--hud-text-bright)]">{interpretation}</p>
          {score?.interpretation && (
            <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{score.interpretation}</p>
          )}
          {score?.recommendation && (
            <p className="mt-2 text-xs text-[var(--hud-text)]">
              <span className="font-semibold">Recommendation:</span> {score.recommendation}
            </p>
          )}
          <div className="mt-2 border-t border-[var(--hud-border)] pt-2 text-[10px] text-[var(--hud-text-dim)]">
            <p>Score ranges: 80-100 (Excellent), 60-79 (Good), 40-59 (Needs attention), 0-39 (Critical)</p>
          </div>
        </div>
      )}
    </div>
  );
}
