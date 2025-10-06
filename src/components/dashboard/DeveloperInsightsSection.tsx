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
      { dimension: "Throughput", value: selectedDeveloperData.throughputScore.score, fullMark: 100 },
      { dimension: "Merge speed", value: selectedDeveloperData.mergeSpeedScore.score, fullMark: 100 },
      {
        dimension: "Review responsiveness",
        value: selectedDeveloperData.reviewResponsivenessScore.score,
        fullMark: 100,
      },
      {
        dimension: "Merge success",
        value: selectedDeveloperData.mergeSuccessScore.score,
        fullMark: 100,
      },
      {
        dimension: "PR size discipline",
        value: selectedDeveloperData.prSizeDisciplineScore.score,
        fullMark: 100,
      },
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

  const topDevelopers = useMemo(() => developers.slice(0, 5), [developers]);
  const improvementCandidates = useMemo(() => {
    if (developers.length <= 3) {
      return [...developers].reverse();
    }
    return developers.slice(-3).reverse();
  }, [developers]);

  return (
    <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="hud-panel hud-corner p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
          Top performers
        </p>
        <div className="mt-3 grid gap-3">
          {topDevelopers.map((dev, index) => (
            <button
              key={dev.author}
              type="button"
              onClick={() => onSelectDeveloper(dev.author)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                selectedDeveloperData?.author === dev.author
                  ? "border-[var(--hud-accent)]/50 bg-[var(--hud-accent)]/10"
                  : "border-[var(--hud-border)] bg-[var(--hud-bg)] hover:border-[var(--hud-accent)]/40 hover:bg-[var(--hud-bg-elevated)]"
              }`}
            >
              <div>
                <p className="text-sm font-medium text-[var(--hud-text-bright)]">{dev.author}</p>
                <p className="text-xs text-[var(--hud-text-dim)]">Overall {dev.overallScore}</p>
              </div>
              <span className="font-mono text-lg font-semibold text-[var(--hud-accent)]">#{index + 1}</span>
            </button>
          ))}
        </div>

        <p className="mt-6 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
          Needs attention
        </p>
        <div className="mt-3 space-y-2">
          {improvementCandidates.map((dev) => (
            <div
              key={`${dev.author}-needs-attention`}
              className="flex items-center justify-between rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-2"
            >
              <div>
                <p className="text-sm font-medium text-[var(--hud-text-bright)]">{dev.author}</p>
                <p className="text-xs text-[var(--hud-text-dim)]">Score {dev.overallScore}</p>
              </div>
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)]">
                Coaching opportunity
              </span>
            </div>
          ))}
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
