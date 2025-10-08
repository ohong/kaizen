"use client";

import { useState } from "react";
import type { ComparisonInsight } from "@/lib/metrics";
import { ComparisonBarChart } from "@/components/charts";

interface BenchmarkMetric {
  name: string;
  yourTeam: number;
  industryMedian: number;
  topPerformer?: number;
}

interface BenchmarkSummaryProps {
  speedData: BenchmarkMetric[];
  qualityData: BenchmarkMetric[];
  insights: ComparisonInsight[];
}

export function BenchmarkSummary({ speedData, qualityData, insights }: BenchmarkSummaryProps) {
  const [expandedCategory, setExpandedCategory] = useState<"speed" | "quality" | null>(null);

  // Calculate overall performance scores
  const speedScore = calculateCategoryScore(speedData, true); // lower is better
  const qualityScore = calculateCategoryScore(qualityData, false); // higher is better
  const overallScore = Math.round((speedScore + qualityScore) / 2);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Benchmarks</h2>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            vs. Industry
          </span>
        </div>
      </div>

      {/* Overall Performance Card */}
      <div className="hud-panel hud-corner mb-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Overall Performance
            </p>
            <p className="mt-2 text-4xl font-semibold text-[var(--hud-text-bright)]">
              {getPerformanceLabel(overallScore)}
            </p>
            <p className="mt-2 text-sm text-[var(--hud-text)]">
              {getPerformanceDescription(overallScore)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Percentile
            </p>
          </div>
        </div>
      </div>

      {/* Speed and Quality Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Speed Category */}
        <CategoryCard
          title="Delivery Speed"
          subtitle="Cycle time metrics"
          score={speedScore}
          metrics={speedData}
          insights={insights.filter(i =>
            i.metric.toLowerCase().includes("time") ||
            i.metric.toLowerCase().includes("merge")
          )}
          expanded={expandedCategory === "speed"}
          onToggle={() => setExpandedCategory(expandedCategory === "speed" ? null : "speed")}
          lowerIsBetter
        />

        {/* Quality Category */}
        <CategoryCard
          title="Code Quality"
          subtitle="Quality & collaboration"
          score={qualityScore}
          metrics={qualityData}
          insights={insights.filter(i =>
            i.metric.toLowerCase().includes("rate") ||
            i.metric.toLowerCase().includes("review")
          )}
          expanded={expandedCategory === "quality"}
          onToggle={() => setExpandedCategory(expandedCategory === "quality" ? null : "quality")}
          lowerIsBetter={false}
        />
      </div>

      {/* Detailed Charts - Only show when expanded */}
      {expandedCategory === "speed" && speedData.length > 0 && (
        <div className="mt-6 hud-panel hud-corner p-6">
          <h3 className="mb-4 text-sm font-semibold text-[var(--hud-text-bright)]">
            Detailed Speed Metrics
          </h3>
          <div className="h-[400px]">
            <ComparisonBarChart
              data={speedData}
              title="Cycle time vs industry"
              yLabel="Hours"
              lowerIsBetter
            />
          </div>
        </div>
      )}

      {expandedCategory === "quality" && qualityData.length > 0 && (
        <div className="mt-6 hud-panel hud-corner p-6">
          <h3 className="mb-4 text-sm font-semibold text-[var(--hud-text-bright)]">
            Detailed Quality Metrics
          </h3>
          <div className="h-[400px]">
            <ComparisonBarChart
              data={qualityData}
              title="Quality signals vs industry"
              yLabel="Value"
            />
          </div>
        </div>
      )}
    </section>
  );
}

interface CategoryCardProps {
  title: string;
  subtitle: string;
  score: number;
  metrics: BenchmarkMetric[];
  insights: ComparisonInsight[];
  expanded: boolean;
  onToggle: () => void;
  lowerIsBetter: boolean;
}

function CategoryCard({
  title,
  subtitle,
  score,
  metrics,
  insights,
  expanded,
  onToggle,
  lowerIsBetter,
}: CategoryCardProps) {
  const topInsight = insights[0];

  return (
    <div className="hud-panel hud-corner p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-[var(--hud-text-bright)]">{title}</h3>
            <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
          </div>
          <p className="mt-1 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Quick metrics overview */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {metrics.slice(0, 2).map((metric) => {
          const performanceVsMedian = lowerIsBetter
            ? ((metric.industryMedian - metric.yourTeam) / metric.industryMedian) * 100
            : ((metric.yourTeam - metric.industryMedian) / metric.industryMedian) * 100;
          const isGood = performanceVsMedian > 0;

          return (
            <div key={metric.name} className="rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
                {metric.name}
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-semibold text-[var(--hud-text-bright)]">
                  {metric.yourTeam.toFixed(1)}
                </span>
                <span className={`font-mono text-xs ${isGood ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isGood ? '↑' : '↓'} {Math.abs(performanceVsMedian).toFixed(0)}%
                </span>
              </div>
              <p className="mt-1 font-mono text-[10px] text-[var(--hud-text-dim)]">
                vs {metric.industryMedian.toFixed(1)} median
              </p>
            </div>
          );
        })}
      </div>

      {/* Top insight */}
      {topInsight && (
        <div className="mt-4 rounded-lg border border-[var(--hud-accent)]/30 bg-[var(--hud-accent)]/5 p-3">
          <div className="flex items-start gap-2">
            <span className="text-[var(--hud-accent)]">💡</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-[var(--hud-text-bright)]">
                {topInsight.metric}
              </p>
              <p className="mt-1 text-xs text-[var(--hud-text)]">
                {topInsight.interpretation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Expand/Collapse button */}
      <button
        type="button"
        onClick={onToggle}
        className={`mt-3 w-full rounded-lg border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider transition-all duration-200 ${
          expanded
            ? "border-[var(--hud-accent)] bg-[var(--hud-accent)]/10 text-[var(--hud-accent)]"
            : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] text-[var(--hud-accent)] hover:border-[var(--hud-accent)]/60 hover:bg-[var(--hud-accent)]/10"
        }`}
      >
        {expanded ? "▼ Hide detailed charts" : "▶ View detailed charts"}
      </button>
    </div>
  );
}

// Helper functions
function calculateCategoryScore(metrics: BenchmarkMetric[], lowerIsBetter: boolean): number {
  if (metrics.length === 0) return 50;

  const percentiles = metrics.map(metric => {
    const ratio = lowerIsBetter
      ? metric.industryMedian / metric.yourTeam
      : metric.yourTeam / metric.industryMedian;

    // Convert ratio to percentile (0-100)
    if (ratio >= 1.5) return 90;
    if (ratio >= 1.2) return 75;
    if (ratio >= 1.0) return 60;
    if (ratio >= 0.8) return 40;
    if (ratio >= 0.6) return 25;
    return 10;
  });

  return Math.round(percentiles.reduce((sum, p) => sum + p, 0) / percentiles.length);
}

function getPerformanceLabel(score: number): string {
  if (score >= 75) return "Exceeding";
  if (score >= 60) return "Meeting";
  if (score >= 40) return "Approaching";
  return "Below";
}

function getPerformanceDescription(score: number): string {
  if (score >= 75) return "Your team is performing above industry standards";
  if (score >= 60) return "Your team is on par with industry peers";
  if (score >= 40) return "Your team is approaching industry benchmarks";
  return "Your team has room to improve vs. peers";
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 60) return "text-blue-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}
