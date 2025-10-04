"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  ScatterChartViz,
  DistributionChart,
  RadarChartViz,
  ComparisonBarChart,
} from "@/components/charts";
import {
  calculateDeveloperEfficiency,
  generateComparisonInsights,
  generateSizeVsTimeScatter,
  generateAdditionsVsDeletionsScatter,
  generateReviewTimeVsMergeTimeScatter,
  type DeveloperEfficiency,
  type ComparisonInsight,
} from "@/lib/metrics";
import type { PullRequest, DeveloperMetrics, RepositoryMetrics } from "@/lib/types/database";

type ViewMode = "overview" | "developer" | "comparison";

export default function InsightsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [developerMetrics, setDeveloperMetrics] = useState<DeveloperMetrics[]>([]);
  const [repositoryMetrics, setRepositoryMetrics] = useState<RepositoryMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load ONLY Supabase PRs (your team)
      const { data: prData, error: prError } = await supabase
        .from("pull_requests")
        .select("*")
        .eq("repository_owner", "supabase")
        .eq("repository_name", "supabase")
        .order("created_at", { ascending: false });

      if (prError) throw prError;

      // Load ONLY Supabase developer metrics (your team)
      const { data: devData, error: devError } = await supabase
        .from("developer_metrics")
        .select("*")
        .eq("repository_owner", "supabase")
        .eq("repository_name", "supabase");

      if (devError) throw devError;

      // Load ALL repository metrics (for comparison)
      const { data: repoData, error: repoError } = await supabase
        .from("repository_metrics")
        .select("*");

      if (repoError) throw repoError;

      setPrs(prData || []);
      setDeveloperMetrics(devData || []);
      setRepositoryMetrics(repoData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Calculate developer efficiency scores
  const developerEfficiencies = useMemo(() => {
    if (!developerMetrics.length || !repositoryMetrics.length) return [];

    return developerMetrics.map((dm) =>
      calculateDeveloperEfficiency(dm, repositoryMetrics)
    );
  }, [developerMetrics, repositoryMetrics]);

  // Get your repository metrics (Supabase)
  const yourRepo = useMemo(() => {
    return repositoryMetrics.find(
      (r) => r.repository_owner === "supabase" && r.repository_name === "supabase"
    );
  }, [repositoryMetrics]);

  // Get benchmark repositories
  const benchmarkRepos = useMemo(() => {
    return repositoryMetrics.filter(
      (r) => !(r.repository_owner === "supabase" && r.repository_name === "supabase")
    );
  }, [repositoryMetrics]);

  // Generate comparison insights
  const comparisonInsights = useMemo(() => {
    if (!yourRepo || !benchmarkRepos.length) return [];
    return generateComparisonInsights(yourRepo, benchmarkRepos);
  }, [yourRepo, benchmarkRepos]);

  // PR size distribution
  const prSizeDistribution = useMemo(() => {
    if (!yourRepo) return [];
    return [
      { category: "Small (≤200)", value: yourRepo.small_prs, color: "#10b981" },
      { category: "Medium (201-1000)", value: yourRepo.medium_prs, color: "#f59e0b" },
      { category: "Large (>1000)", value: yourRepo.large_prs, color: "#ef4444" },
    ];
  }, [yourRepo]);

  // Scatter plot data
  const sizeVsTimeData = useMemo(() => generateSizeVsTimeScatter(prs), [prs]);
  const additionsVsDeletionsData = useMemo(() => generateAdditionsVsDeletionsScatter(prs), [prs]);

  // Top developers
  const topDevelopers = useMemo(() => {
    return [...developerEfficiencies]
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, 10);
  }, [developerEfficiencies]);

  // Selected developer data
  const selectedDeveloperData = useMemo(() => {
    if (!selectedDeveloper) return null;
    return developerEfficiencies.find((d) => d.author === selectedDeveloper);
  }, [selectedDeveloper, developerEfficiencies]);

  const selectedDeveloperRadarData = useMemo(() => {
    if (!selectedDeveloperData) return [];
    return [
      { dimension: "Velocity", value: selectedDeveloperData.velocityScore.score, fullMark: 100 },
      { dimension: "Quality", value: selectedDeveloperData.qualityScore.score, fullMark: 100 },
      { dimension: "Collaboration", value: selectedDeveloperData.collaborationScore.score, fullMark: 100 },
      { dimension: "Consistency", value: selectedDeveloperData.consistencyScore.score, fullMark: 100 },
    ];
  }, [selectedDeveloperData]);

  // Comparison chart data
  const comparisonChartData = useMemo(() => {
    if (!yourRepo || !benchmarkRepos.length) return [];

    const metrics = [
      {
        name: "Merge Time (hrs)",
        yourTeam: yourRepo.avg_merge_hours || 0,
        industryMedian: benchmarkRepos.reduce((sum, r) => sum + (r.avg_merge_hours || 0), 0) / benchmarkRepos.length,
        topPerformer: Math.min(...benchmarkRepos.map(r => r.avg_merge_hours || 999)),
      },
      {
        name: "PR Size (lines)",
        yourTeam: yourRepo.avg_pr_size || 0,
        industryMedian: benchmarkRepos.reduce((sum, r) => sum + (r.avg_pr_size || 0), 0) / benchmarkRepos.length,
        topPerformer: Math.min(...benchmarkRepos.map(r => r.avg_pr_size || 999)),
      },
      {
        name: "Merge Rate (%)",
        yourTeam: yourRepo.merge_rate_percent || 0,
        industryMedian: benchmarkRepos.reduce((sum, r) => sum + (r.merge_rate_percent || 0), 0) / benchmarkRepos.length,
        topPerformer: Math.max(...benchmarkRepos.map(r => r.merge_rate_percent || 0)),
      },
    ];

    return metrics;
  }, [yourRepo, benchmarkRepos]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-slate-400">Loading insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-8 px-6 py-10">
        {/* Header */}
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-semibold text-white">Developer Insights</h1>
              <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm font-medium text-purple-300">
                Supabase Team
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Efficiency metrics for your team compared to industry benchmarks from {benchmarkRepos.length} companies
            </p>
          </div>
          <div className="flex gap-2">
            <ViewModeButton
              active={viewMode === "overview"}
              onClick={() => setViewMode("overview")}
            >
              Overview
            </ViewModeButton>
            <ViewModeButton
              active={viewMode === "developer"}
              onClick={() => setViewMode("developer")}
            >
              Developer Profiles
            </ViewModeButton>
            <ViewModeButton
              active={viewMode === "comparison"}
              onClick={() => setViewMode("comparison")}
            >
              Company Comparison
            </ViewModeButton>
          </div>
        </header>

        {/* Overview Mode */}
        {viewMode === "overview" && (
          <>
            {/* Key Metrics */}
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Total Contributors"
                value={developerMetrics.length.toString()}
                trend={null}
              />
              <MetricCard
                label="Total PRs"
                value={prs.length.toString()}
                trend={null}
              />
              <MetricCard
                label="Avg Merge Time"
                value={yourRepo ? `${(yourRepo.avg_merge_hours || 0).toFixed(1)}h` : "—"}
                trend={yourRepo ? (yourRepo.avg_merge_hours || 0) < 24 ? "good" : "warning" : null}
              />
              <MetricCard
                label="Merge Rate"
                value={yourRepo ? `${(yourRepo.merge_rate_percent || 0).toFixed(1)}%` : "—"}
                trend={yourRepo ? (yourRepo.merge_rate_percent || 0) > 80 ? "good" : "warning" : null}
              />
            </section>

            {/* Visualizations Grid */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="h-[400px]">
                <ScatterChartViz
                  data={sizeVsTimeData}
                  xLabel="PR Size"
                  yLabel="Time to Merge"
                  title="PR Size vs Time to Merge"
                  xUnit=" lines"
                  yUnit=" hrs"
                />
              </div>
              <div className="h-[400px]">
                <DistributionChart
                  data={prSizeDistribution}
                  title="PR Size Distribution"
                  yLabel="Number of PRs"
                />
              </div>
            </section>

            {/* Top Performers */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">Top Performers</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {topDevelopers.slice(0, 5).map((dev) => (
                  <button
                    key={dev.author}
                    onClick={() => {
                      setSelectedDeveloper(dev.author);
                      setViewMode("developer");
                    }}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-left transition-colors hover:border-slate-600"
                  >
                    <p className="text-sm font-medium text-white">{dev.author}</p>
                    <p className="mt-2 text-2xl font-semibold text-purple-400">{dev.overallScore}</p>
                    <p className="mt-1 text-xs text-slate-500">Overall Score</p>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

        {/* Developer Mode */}
        {viewMode === "developer" && (
          <>
            {/* Developer Selection */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">Select Developer</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {topDevelopers.map((dev) => (
                  <button
                    key={dev.author}
                    onClick={() => setSelectedDeveloper(dev.author)}
                    className={`rounded-lg border p-3 text-left transition-colors ${
                      selectedDeveloper === dev.author
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm font-medium text-white">{dev.author}</p>
                    <p className="mt-1 text-lg font-semibold text-purple-400">{dev.overallScore}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Developer Details */}
            {selectedDeveloperData && (
              <>
                <section className="grid gap-6 lg:grid-cols-2">
                  <div className="h-[400px]">
                    <RadarChartViz
                      data={selectedDeveloperRadarData}
                      title={`${selectedDeveloper} - Efficiency Profile`}
                      name={selectedDeveloper || "Developer"}
                      color="#8b5cf6"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
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
                </section>
                <section className="grid gap-4 lg:grid-cols-2">
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
                </section>
              </>
            )}
          </>
        )}

        {/* Comparison Mode */}
        {viewMode === "comparison" && (
          <>
            {/* Comparison Chart */}
            <section className="h-[500px]">
              <ComparisonBarChart
                data={comparisonChartData}
                title="Your Team vs Industry Benchmarks"
                yLabel="Value"
              />
            </section>

            {/* Insights */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">Comparison Insights</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {comparisonInsights.map((insight) => (
                  <InsightCard key={insight.metric} insight={insight} />
                ))}
              </div>
            </section>

            {/* Benchmark Repositories */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-white">Benchmark Repositories</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {benchmarkRepos.map((repo) => (
                  <div
                    key={`${repo.repository_owner}/${repo.repository_name}`}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                  >
                    <p className="font-medium text-white">
                      {repo.repository_owner}/{repo.repository_name}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">PRs</p>
                        <p className="font-semibold text-white">{repo.total_prs}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Contributors</p>
                        <p className="font-semibold text-white">{repo.active_contributors}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Merge Time</p>
                        <p className="font-semibold text-white">{(repo.avg_merge_hours || 0).toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Merge Rate</p>
                        <p className="font-semibold text-white">{(repo.merge_rate_percent || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ViewModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-purple-600 text-white"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: "good" | "warning" | null;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {trend && (
        <p className={`mt-1 text-xs ${trend === "good" ? "text-green-400" : "text-amber-400"}`}>
          {trend === "good" ? "✓ Good" : "⚠ Needs attention"}
        </p>
      )}
    </div>
  );
}

function ScoreCard({
  title,
  score,
  percentile,
  interpretation,
  recommendation,
}: {
  title: string;
  score: number;
  percentile: number;
  interpretation: string;
  recommendation: string;
}) {
  const scoreColor =
    score >= 80 ? "text-green-400" : score >= 60 ? "text-blue-400" : score >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <div className="text-right">
          <p className={`text-2xl font-semibold ${scoreColor}`}>{score.toFixed(0)}</p>
          <p className="text-xs text-slate-500">{percentile}th percentile</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">{interpretation}</p>
      <div className="mt-3 rounded-lg bg-slate-950/50 p-3">
        <p className="text-xs font-medium text-slate-400">Recommendation</p>
        <p className="mt-1 text-xs text-slate-300">{recommendation}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: ComparisonInsight }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-sm font-medium text-white">{insight.metric}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Your Value</p>
          <p className="mt-1 font-semibold text-white">{insight.yourValue.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-slate-500">Industry Median</p>
          <p className="mt-1 font-semibold text-white">{insight.industryMedian.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-slate-500">Percentile</p>
          <p className="mt-1 font-semibold text-purple-400">{insight.percentile}th</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-300">{insight.interpretation}</p>
    </div>
  );
}
