"use client";

import { useMemo } from "react";

import type { DeveloperEfficiency } from "@/lib/metrics";


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

  return (
    <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="hud-panel hud-corner p-6 space-y-4">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--hud-text)] transition-colors group-open:border-[var(--hud-border)] group-open:bg-[var(--hud-bg-elevated)]">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Top performers
              </p>
              <p className="text-sm text-[var(--hud-text)]">
                {topSummary
                  ? `${topSummary.count} engineers scoring up to ${Math.round(topSummary.highestScore)}.`
                  : "No recent standout contributors."}
              </p>
            </div>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90"
              aria-hidden
            >
              ▸
            </span>
          </summary>
          {topDevelopers.length > 0 && (
            <div className="mt-4 space-y-3">
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
          )}
        </details>

        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-[var(--hud-text)] transition-colors group-open:border-[var(--hud-border)] group-open:bg-[var(--hud-bg-elevated)]">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Needs attention
              </p>
              <p className="text-sm text-[var(--hud-text)]">
                {attentionSummary
                  ? `${attentionSummary.count} engineers trending down to ${Math.round(attentionSummary.lowestScore)}.`
                  : "No coaching signals detected."}
              </p>
            </div>
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90"
              aria-hidden
            >
              ▸
            </span>
          </summary>
          {improvementCandidates.length > 0 && (
            <div className="mt-4 space-y-3">
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
          )}
        </details>
      </div>

    </section>
  );
}
