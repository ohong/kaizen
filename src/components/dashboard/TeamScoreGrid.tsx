import type { TeamEfficiencySummary } from "@/lib/metrics";

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
          fallback="We’ll show collaboration once review data lands"
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
  const isReady = Boolean(score);
  const displayScore = score ? Math.round(score.score) : null;
  const scoreColor = !score
    ? "text-[var(--hud-text-dim)]"
    : score.score >= 80
      ? "text-emerald-400"
      : score.score >= 60
        ? "text-blue-400"
        : score.score >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="hud-panel hud-corner flex h-full flex-col p-3">
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
    </div>
  );
}
