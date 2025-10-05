"use client";

import { useMemo } from "react";

import type { DeveloperEfficiency } from "@/lib/metrics";

import { RadarChartViz } from "@/components/charts";

interface DeveloperInsightsSectionProps {
  developers: DeveloperEfficiency[];
  selectedDeveloper: string | null;
  onSelectDeveloper: (author: string) => void;
}

export function DeveloperInsightsSection({
  developers,
  selectedDeveloper,
  onSelectDeveloper,
}: DeveloperInsightsSectionProps) {
  const selectedDeveloperData = useMemo(() => {
    if (!developers.length) return null;
    if (!selectedDeveloper) return developers[0];
    return developers.find((dev) => dev.author === selectedDeveloper) ?? developers[0];
  }, [developers, selectedDeveloper]);

  const radarData = useMemo(() => {
    if (!selectedDeveloperData) return [];
    return [
      { dimension: "Velocity", value: selectedDeveloperData.velocityScore.score, fullMark: 100 },
      { dimension: "Quality", value: selectedDeveloperData.qualityScore.score, fullMark: 100 },
      {
        dimension: "Collaboration",
        value: selectedDeveloperData.collaborationScore.score,
        fullMark: 100,
      },
      {
        dimension: "Consistency",
        value: selectedDeveloperData.consistencyScore.score,
        fullMark: 100,
      },
    ];
  }, [selectedDeveloperData]);

  const topDevelopers = developers.slice(0, 5);
  const improvementCandidates = developers.length <= 3
    ? [...developers].reverse()
    : developers.slice(-3).reverse();

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="hud-panel hud-corner p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Developer leaderboard
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">
              Efficiency patterns by teammate
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {topDevelopers.map((dev) => {
              const isSelected = selectedDeveloperData?.author === dev.author;
              return (
                <button
                  key={dev.author}
                  type="button"
                  onClick={() => onSelectDeveloper(dev.author)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors duration-150 ${
                    isSelected
                      ? "border-[var(--hud-accent)] bg-[var(--hud-accent)]/10 text-[var(--hud-text-bright)]"
                      : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] text-[var(--hud-text)] hover:border-[var(--hud-accent)]/40"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{dev.author}</p>
                    <p className="text-xs text-[var(--hud-text-dim)]">
                      Score {Math.round(dev.overallScore)}
                    </p>
                  </div>
                  <span className="rounded-full border border-[var(--hud-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--hud-text-dim)]">
                    Top 5
                  </span>
                </button>
              );
            })}
          </div>
          <div className="space-y-3">
            {improvementCandidates.map((dev) => (
              <div
                key={dev.author}
                className="flex items-center justify-between rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-2"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--hud-text-bright)]">{dev.author}</p>
                  <p className="text-xs text-[var(--hud-text-dim)]">
                    Score {Math.round(dev.overallScore)}
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)]">
                  Coaching opportunity
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[320px] hud-panel hud-corner p-4">
            <RadarChartViz
              data={radarData}
              title={
                selectedDeveloperData
                  ? `${selectedDeveloperData.author} - efficiency profile`
                  : "Efficiency profile"
              }
              name={selectedDeveloperData?.author ?? "Developer"}
              color="#8b5cf6"
            />
          </div>
          {selectedDeveloperData && (
            <div className="grid gap-4">
              <ScoreCard
                title="Velocity"
                score={selectedDeveloperData.velocityScore.score}
                percentile={selectedDeveloperData.velocityScore.percentile}
                interpretation={selectedDeveloperData.velocityScore.interpretation}
                recommendation={selectedDeveloperData.velocityScore.recommendation}
              />
              <ScoreCard
                title="Quality"
                score={selectedDeveloperData.qualityScore.score}
                percentile={selectedDeveloperData.qualityScore.percentile}
                interpretation={selectedDeveloperData.qualityScore.interpretation}
                recommendation={selectedDeveloperData.qualityScore.recommendation}
              />
            </div>
          )}
        </div>
        {selectedDeveloperData && (
          <div className="grid gap-4 lg:grid-cols-2">
            <ScoreCard
              title="Collaboration"
              score={selectedDeveloperData.collaborationScore.score}
              percentile={selectedDeveloperData.collaborationScore.percentile}
              interpretation={selectedDeveloperData.collaborationScore.interpretation}
              recommendation={selectedDeveloperData.collaborationScore.recommendation}
            />
            <ScoreCard
              title="Consistency"
              score={selectedDeveloperData.consistencyScore.score}
              percentile={selectedDeveloperData.consistencyScore.percentile}
              interpretation={selectedDeveloperData.consistencyScore.interpretation}
              recommendation={selectedDeveloperData.consistencyScore.recommendation}
            />
          </div>
        )}
      </div>
    </section>
  );
}

interface ScoreCardProps {
  title: string;
  score: number;
  percentile: number;
  interpretation: string;
  recommendation: string;
}

function ScoreCard({ title, score, percentile, interpretation, recommendation }: ScoreCardProps) {
  const scoreColor =
    score >= 80
      ? "text-emerald-400"
      : score >= 60
        ? "text-blue-400"
        : score >= 40
          ? "text-amber-400"
          : "text-red-400";

  return (
    <div className="hud-panel hud-corner p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--hud-text-bright)]">{title}</h3>
        <div className="text-right">
          <p className={`text-2xl font-semibold ${scoreColor}`}>{Math.round(score)}</p>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            {percentile}th percentile
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--hud-text)]">{interpretation}</p>
      <div className="mt-3 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-3">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
          Recommendation
        </p>
        <p className="mt-1 text-xs text-[var(--hud-text)]">{recommendation}</p>
      </div>
    </div>
  );
}
