"use client";

import { useMemo } from "react";

import type { DeveloperEfficiency } from "@/lib/metrics";
import { getScoreColor } from "@/lib/score-colors";
import { RadarChartViz } from "@/components/charts/RadarChart";


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

  const topDevelopers = useMemo(() => developers.slice(0, 5), [developers]);
  const improvementCandidates = useMemo(() => {
    if (developers.length <= 3) {
      return [...developers].reverse();
    }
    return developers.slice(-3).reverse();
  }, [developers]);

  const topSummary = useMemo(() => {
    if (!topDevelopers.length) return null;
    const highestScore = Math.max(...topDevelopers.map((dev) => dev.overallScore));
    return {
      count: topDevelopers.length,
      highestScore,
    };
  }, [topDevelopers]);

  const attentionSummary = useMemo(() => {
    if (!improvementCandidates.length) return null;
    const lowestScore = Math.min(...improvementCandidates.map((dev) => dev.overallScore));
    return {
      count: improvementCandidates.length,
      lowestScore,
    };
  }, [improvementCandidates]);

  if (!developers.length) {
    return (
      <section className="hud-panel hud-corner p-8 text-center text-sm text-[var(--hud-text-dim)]">
        We need more data before we can surface developer-level insights.
      </section>
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[440px_1fr]">
      <div className="hud-panel hud-corner flex flex-col gap-5 rounded-xl p-5">
        <details className="group" open>
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-[var(--hud-text)] transition-all group-open:border-[var(--hud-border)] group-open:bg-[var(--hud-bg-elevated)]">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
                  Top Performers
                </span>
                {topSummary && (
                  <span className="rounded-full bg-[var(--hud-accent)]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--hud-accent)]">
                    {topSummary.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--hud-text)]">
                {topSummary
                  ? `Scoring up to ${Math.round(topSummary.highestScore)}`
                  : "No recent standout contributors"}
              </p>
            </div>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--hud-border)] bg-[var(--hud-bg)] text-[var(--hud-text-dim)] transition-transform duration-200 group-open:rotate-90"
              aria-hidden
            >
              ▸
            </span>
          </summary>
          {topDevelopers.length > 0 && (
            <div className="mt-4 space-y-2">
              {topDevelopers.map((dev, index) => (
                <DeveloperCard
                  key={dev.author}
                  dev={dev}
                  index={index}
                  isSelected={selectedDeveloperData?.author === dev.author}
                  onClick={() => onSelectDeveloper(dev.author)}
                />
              ))}
            </div>
          )}
        </details>

        <div className="h-px bg-gradient-to-r from-transparent via-[var(--hud-border)] to-transparent" />

        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-[var(--hud-text)] transition-all group-open:border-[var(--hud-warning)]/30 group-open:bg-[var(--hud-warning)]/5">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
                  Needs Attention
                </span>
                {attentionSummary && (
                  <span className="rounded-full bg-[var(--hud-warning)]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[var(--hud-warning)]">
                    {attentionSummary.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--hud-text)]">
                {attentionSummary
                  ? `Trending down to ${Math.round(attentionSummary.lowestScore)}`
                  : "No coaching signals detected"}
              </p>
            </div>
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-[var(--hud-border)] bg-[var(--hud-bg)] text-[var(--hud-text-dim)] transition-transform duration-200 group-open:rotate-90"
              aria-hidden
            >
              ▸
            </span>
          </summary>
          {improvementCandidates.length > 0 && (
            <div className="mt-4 space-y-2">
              {improvementCandidates.map((dev) => (
                <AttentionCard key={`${dev.author}-needs-attention`} dev={dev} />
              ))}
            </div>
          )}
        </details>
      </div>

      {selectedDeveloperData && (
        <DeveloperDetailPane developer={selectedDeveloperData} />
      )}
    </section>
  );
}

interface DeveloperCardProps {
  dev: DeveloperEfficiency;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function DeveloperDetailPane({ developer }: { developer: DeveloperEfficiency }) {
  const primaryMetrics = [
    { key: "velocity", label: "Velocity", data: developer.velocityScore },
    { key: "quality", label: "Quality", data: developer.qualityScore },
    { key: "collaboration", label: "Collaboration", data: developer.collaborationScore },
    { key: "consistency", label: "Consistency", data: developer.consistencyScore },
  ];

  const ordered = [...primaryMetrics].sort((a, b) => b.data.score - a.data.score);
  const topStrength = ordered[0];
  const attention = ordered[ordered.length - 1];

  // Order: Consistency (top), Quality (right), Collaboration (bottom), Velocity (left)
  const orderedMetrics = [
    primaryMetrics.find(m => m.key === 'consistency')!,
    primaryMetrics.find(m => m.key === 'quality')!,
    primaryMetrics.find(m => m.key === 'collaboration')!,
    primaryMetrics.find(m => m.key === 'velocity')!,
  ];

  const radarData = orderedMetrics.map((metric) => ({
    dimension: metric.label,
    value: Math.round(metric.data.score),
    fullMark: 100,
  }));

  return (
    <div className="hud-panel-prominent hud-corner flex flex-col gap-6 rounded-xl p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="hud-badge">Selected Engineer</p>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-semibold text-[var(--hud-text-bright)]">
              {developer.author}
            </h3>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--hud-accent)]/40 bg-[var(--hud-bg-elevated)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-accent)]">
              Score
              <span className="text-[var(--hud-text-bright)]">{Math.round(developer.overallScore)}</span>
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <InsightBadge
            label="Strength"
            value={topStrength.label}
            tone="success"
          />
          <InsightBadge
            label="Focus"
            value={attention.label}
            tone="warning"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="hud-panel flex flex-col gap-3 rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
            Attributes
          </span>
          <div className="flex-1">
            <RadarChartViz
              data={radarData}
              title=""
              name={developer.author}
              color="#00ff88"
            />
          </div>
        </div>
        <div className="space-y-4">
          <InsightCard
            title="Quality Strength"
            description={topStrength.data.interpretation}
            tone="success"
            metric={topStrength.label}
            score={Math.round(topStrength.data.score)}
          />
          <InsightCard
            title="Consistency Next Move"
            description={attention.data.recommendation || attention.data.interpretation}
            tone="warning"
            metric={attention.label}
            score={Math.round(attention.data.score)}
          />
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  title,
  description,
  tone,
  metric,
  score,
}: {
  title: string;
  description: string;
  tone: "success" | "warning";
  metric: string;
  score: number;
}) {
  const toneColor = tone === "success" ? "text-[var(--hud-success)]" : "text-[var(--hud-warning)]";
  const toneBorder =
    tone === "success" ? "border-[var(--hud-success)]/30" : "border-[var(--hud-warning)]/30";
  const toneBg =
    tone === "success" ? "bg-[var(--hud-success)]/5" : "bg-[var(--hud-warning)]/5";

  return (
    <div className={`hud-panel flex flex-col gap-3 rounded-xl border px-4 py-4 ${toneBorder} ${toneBg}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
          {metric}
        </span>
        <span className={`font-mono text-lg font-bold ${toneColor}`}>
          {score}
        </span>
      </div>
      <h4 className={`text-xs font-semibold uppercase tracking-[0.3em] ${toneColor}`}>
        {title}
      </h4>
      <p className="text-sm leading-relaxed text-[var(--hud-text)]">{description}</p>
    </div>
  );
}

function InsightBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning";
}) {
  const toneColor = tone === "success" ? "text-[var(--hud-success)]" : "text-[var(--hud-warning)]";
  const toneBorder =
    tone === "success" ? "border-[var(--hud-success)]/30" : "border-[var(--hud-warning)]/30";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 ${toneBorder}`}>
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
        {label}
      </span>
      <span className={`font-mono text-xs font-semibold ${toneColor}`}>
        {value}
      </span>
    </div>
  );
}

function DeveloperCard({ dev, index, isSelected, onClick }: DeveloperCardProps) {
  const scoreColor = getScoreColor(dev.overallScore);
  const roundedScore = Math.round(dev.overallScore);

  // Rank styling
  const rankColor = index === 0
    ? "text-[var(--hud-accent)]"
    : index === 1
    ? "text-[var(--hud-text-bright)]"
    : "text-[var(--hud-text)]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all duration-200 hover:scale-[1.01] ${
        isSelected
          ? "border-[var(--hud-accent)]/60 bg-[var(--hud-accent)]/10 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
          : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)]/40 hover:border-[var(--hud-accent)]/40 hover:bg-[var(--hud-bg-elevated)]"
      }`}
    >
      {/* Rank Badge */}
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--hud-border)] bg-[var(--hud-bg)] font-mono text-lg font-bold ${rankColor}`}>
        {index + 1}
      </div>

      {/* Developer Info */}
      <div className="min-w-0 flex-1">
        <span className="truncate font-mono text-sm font-medium text-[var(--hud-text-bright)]">
          {dev.author}
        </span>
      </div>

      {/* Score Display */}
      <div className={`shrink-0 font-mono text-2xl font-bold ${scoreColor}`}>
        {roundedScore}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[var(--hud-accent)] shadow-[0_0_8px_var(--hud-accent)]" />
      )}
    </button>
  );
}

interface AttentionCardProps {
  dev: DeveloperEfficiency;
}

function AttentionCard({ dev }: AttentionCardProps) {
  const scoreColor = getScoreColor(dev.overallScore);
  const roundedScore = Math.round(dev.overallScore);

  return (
    <div className="group relative flex w-full items-center gap-3 rounded-lg border border-[var(--hud-warning)]/30 bg-[var(--hud-warning)]/5 px-3 py-2 transition-all duration-200 hover:scale-[1.01] hover:border-[var(--hud-warning)]/50">
      {/* Warning Indicator */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--hud-warning)]/40 bg-[var(--hud-bg)]">
        <span className="font-mono text-sm text-[var(--hud-warning)]">!</span>
      </div>

      {/* Developer Info */}
      <div className="min-w-0 flex-1">
        <span className="truncate font-mono text-sm font-medium text-[var(--hud-text-bright)]">
          {dev.author}
        </span>
      </div>

      {/* Score Display */}
      <div className={`shrink-0 font-mono text-2xl font-bold ${scoreColor}`}>
        {roundedScore}
      </div>

      {/* Left accent bar */}
      <div className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[var(--hud-warning)]/60" />
    </div>
  );
}
