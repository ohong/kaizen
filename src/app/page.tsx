"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { CopilotSidebar } from "@copilotkit/react-ui";

import { supabase } from "@/lib/supabase";
import {
  DEFAULT_REPO,
  buildRepositoryUrl,
  getAvailableRepositories,
  parseRepositoryFromUrl,
  type RepositoryOption,
} from "@/lib/repository-utils";
import {
  calculateDeveloperEfficiency,
  generateComparisonInsights,
  generateSizeVsTimeScatter,
  generateReviewTimeVsMergeTimeScatter,
  type ComparisonInsight,
} from "@/lib/metrics";
import type {
  DeveloperMetrics,
  PullRequest,
  RepositoryMetrics,
  DatadogError,
} from "@/lib/types/database";
import {
  ComparisonBarChart,
  DistributionChart,
  RadarChartViz,
  ScatterChartViz,
} from "@/components/charts";
import DatadogErrorsSection from "@/components/DatadogErrorsSection";

const COPILOT_INSTRUCTIONS = `You are Kaizen's delivery analytics copilot. Help engineering leaders understand repository health, pull requests, developers, and operational metrics. You can call GitHub MCP tools to inspect repositories and Supabase's SQL tool run_supabase_sql to query analytics tables. Prefer read-only queries; avoid destructive SQL. Always explain how you reached conclusions and surface specific metrics or PR examples when available.`;

const COPILOT_LABELS = {
  title: "Kaizen Copilot",
  placeholder: "Ask about throughput, review times, or repo activity…",
} as const;

interface HealthSummary {
  healthScore: number | null;
  summary: string;
  throughputPerWeek: number | null;
  mergeRate: number | null;
  avgMergeHours: number | null;
  avgTimeToFirstReview: number | null;
  avgReviewsPerPR: number | null;
  activeContributors: number | null;
  smallPRShare: number | null;
  largePRShare: number | null;
  openPrCount: number;
  stalePrCount: number;
  backlogBuckets: { label: string; count: number }[];
  wins: string[];
  focusAreas: string[];
}

interface ActionGroup {
  key: string;
  title: string;
  description: string;
  prs: PullRequest[];
}

// Dummy emails + one real email (mirrors /feedback page)
const AVAILABLE_EMAILS = [
  "javokhir@raisedash.com",
  "alice.anderson@example.com",
  "bob.builder@example.com",
  "charlie.chen@example.com",
  "diana.davis@example.com",
  "evan.edwards@example.com",
  "fiona.fisher@example.com",
  "george.garcia@example.com",
  "hannah.harris@example.com",
  "ian.irwin@example.com",
  "julia.johnson@example.com",
  "kevin.kim@example.com",
  "laura.lopez@example.com",
  "michael.martinez@example.com",
  "nina.nguyen@example.com",
  "oliver.owen@example.com",
  "patricia.patel@example.com",
  "quinn.quinn@example.com",
  "rachel.rodriguez@example.com",
  "samuel.smith@example.com",
  "tina.taylor@example.com",
];

interface ErrorsSummary {
  total: number;
  byService: { category: string; value: number }[];
  byEnv: { category: string; value: number }[];
  timeline: { date: string; count: number }[];
  recent: DatadogError[];
  topMessages: { message: string; count: number }[];
}

interface ReportPayload {
  repository: { owner: string; name: string };
  latestSync: string | null;
  health: HealthSummary;
  actionQueue: { key: string; title: string; count: number }[];
  developers: {
    top: { author: string; overallScore: number }[];
    needsAttention: { author: string; overallScore: number }[];
  };
  benchmarks: {
    speed: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
    quality: { name: string; yourTeam: number; industryMedian: number; topPerformer?: number }[];
  };
  distributions: { prSizeDistribution: { category: string; value: number; color: string }[] };
  chartsSummary: { sizeVsTimePoints: number; reviewVsMergePoints: number };
  errors: ErrorsSummary | null;
}

export default function ManagerDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [developerMetrics, setDeveloperMetrics] = useState<DeveloperMetrics[]>([]);
  const [repositoryMetrics, setRepositoryMetrics] = useState<RepositoryMetrics[]>([]);
  const [repositories, setRepositories] = useState<RepositoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportResult, setReportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errorsSummary, setErrorsSummary] = useState<ErrorsSummary | null>(null);
  const [errorsSummaryLoading, setErrorsSummaryLoading] = useState(false);

  const selectedRepository = useMemo(
    () => parseRepositoryFromUrl(searchParams),
    [searchParams]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [prResult, devResult, repoResult] = await Promise.all([
        supabase
          .from("pull_requests")
          .select("*")
          .eq("repository_owner", selectedRepository.owner)
          .eq("repository_name", selectedRepository.name)
          .order("updated_at", { ascending: false }),
        supabase
          .from("developer_metrics")
          .select("*")
          .eq("repository_owner", selectedRepository.owner)
          .eq("repository_name", selectedRepository.name),
        supabase.from("repository_metrics").select("*"),
      ]);

      if (prResult.error) throw prResult.error;
      if (devResult.error) throw devResult.error;
      if (repoResult.error) throw repoResult.error;

      setPrs(prResult.data ?? []);
      setDeveloperMetrics(devResult.data ?? []);
      setRepositoryMetrics(repoResult.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setPrs([]);
      setDeveloperMetrics([]);
      setRepositoryMetrics([]);
    } finally {
      setLoading(false);
    }
  }, [selectedRepository]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    getAvailableRepositories().then(setRepositories);
  }, []);

  const repoMetrics = useMemo(
    () =>
      repositoryMetrics.find(
        (r) =>
          r.repository_owner === selectedRepository.owner &&
          r.repository_name === selectedRepository.name
      ),
    [repositoryMetrics, selectedRepository]
  );

  const benchmarkRepos = useMemo(
    () =>
      repositoryMetrics.filter(
        (r) =>
          r.repository_owner !== selectedRepository.owner ||
          r.repository_name !== selectedRepository.name
      ),
    [repositoryMetrics, selectedRepository]
  );

  const developerEfficiencies = useMemo(() => {
    if (!developerMetrics.length || !repositoryMetrics.length) {
      return [];
    }

    return developerMetrics.map((dm) =>
      calculateDeveloperEfficiency(dm, repositoryMetrics)
    );
  }, [developerMetrics, repositoryMetrics]);

  const sortedDevelopers = useMemo(
    () =>
      [...developerEfficiencies].sort(
        (a, b) => b.overallScore - a.overallScore
      ),
    [developerEfficiencies]
  );

  useEffect(() => {
    if (!sortedDevelopers.length) {
      setSelectedDeveloper(null);
      return;
    }

    if (
      !selectedDeveloper ||
      !sortedDevelopers.some((dev) => dev.author === selectedDeveloper)
    ) {
      setSelectedDeveloper(sortedDevelopers[0].author);
    }
  }, [sortedDevelopers, selectedDeveloper]);

  const selectedDeveloperData = useMemo(() => {
    if (!sortedDevelopers.length) {
      return null;
    }
    return (
      sortedDevelopers.find((dev) => dev.author === selectedDeveloper) ??
      sortedDevelopers[0]
    );
  }, [sortedDevelopers, selectedDeveloper]);

  const developerRadarData = useMemo(() => {
    if (!selectedDeveloperData) return [];

    return [
      { dimension: "Velocity", value: selectedDeveloperData.velocityScore.score, fullMark: 100 },
      { dimension: "Quality", value: selectedDeveloperData.qualityScore.score, fullMark: 100 },
      { dimension: "Collaboration", value: selectedDeveloperData.collaborationScore.score, fullMark: 100 },
      { dimension: "Consistency", value: selectedDeveloperData.consistencyScore.score, fullMark: 100 },
    ];
  }, [selectedDeveloperData]);

  const topDevelopers = useMemo(
    () => sortedDevelopers.slice(0, 5),
    [sortedDevelopers]
  );

  const improvementCandidates = useMemo(() => {
    if (sortedDevelopers.length <= 3) {
      return [...sortedDevelopers].reverse();
    }
    return sortedDevelopers.slice(-3).reverse();
  }, [sortedDevelopers]);

  const healthSummary = useMemo(
    () => computeTeamHealth(repoMetrics, prs),
    [repoMetrics, prs]
  );

  const actionGroups = useMemo(
    () => buildActionGroups(prs),
    [prs]
  );

  const latestSync = useMemo(() => computeLatestSync(prs), [prs]);

  const prSizeDistribution = useMemo(() => {
    if (!repoMetrics) return [];
    return [
      { category: "Small (≤200 lines)", value: repoMetrics.small_prs, color: "#10b981" },
      { category: "Medium (201-1000)", value: repoMetrics.medium_prs, color: "#f59e0b" },
      { category: "Large (>1000)", value: repoMetrics.large_prs, color: "#ef4444" },
    ];
  }, [repoMetrics]);

  const sizeVsTimeData = useMemo(
    () => generateSizeVsTimeScatter(prs),
    [prs]
  );

  const reviewVsMergeData = useMemo(
    () => generateReviewTimeVsMergeTimeScatter(prs),
    [prs]
  );

  const comparisonInsights = useMemo<ComparisonInsight[]>(() => {
    if (!repoMetrics || !benchmarkRepos.length) return [];
    return generateComparisonInsights(repoMetrics, benchmarkRepos);
  }, [repoMetrics, benchmarkRepos]);

  const comparisonSpeedData = useMemo(() => {
    if (!repoMetrics || !benchmarkRepos.length) return [];

    const mergeTimes = benchmarkRepos
      .map((r) => r.avg_merge_hours || 0)
      .filter((value) => value > 0);
    const reviewTimes = benchmarkRepos
      .map((r) => r.avg_time_to_first_review_hours || 0)
      .filter((value) => value > 0);

    return [
      {
        name: "Time to Merge (h)",
        yourTeam: repoMetrics.avg_merge_hours || 0,
        industryMedian: median(mergeTimes),
        topPerformer: mergeTimes.length ? Math.min(...mergeTimes) : undefined,
      },
      {
        name: "First Review (h)",
        yourTeam: repoMetrics.avg_time_to_first_review_hours || 0,
        industryMedian: median(reviewTimes),
        topPerformer: reviewTimes.length ? Math.min(...reviewTimes) : undefined,
      },
    ];
  }, [repoMetrics, benchmarkRepos]);

  const comparisonQualityData = useMemo(() => {
    if (!repoMetrics || !benchmarkRepos.length) return [];

    const mergeRates = benchmarkRepos.map((r) => r.merge_rate_percent || 0);
    const reviewDepths = benchmarkRepos.map((r) => r.avg_reviews_per_pr || 0);

    return [
      {
        name: "Merge Rate (%)",
        yourTeam: repoMetrics.merge_rate_percent || 0,
        industryMedian: median(mergeRates),
        topPerformer: mergeRates.length ? Math.max(...mergeRates) : undefined,
      },
      {
        name: "Reviews per PR",
        yourTeam: repoMetrics.avg_reviews_per_pr || 0,
        industryMedian: median(reviewDepths),
        topPerformer: reviewDepths.length ? Math.max(...reviewDepths) : undefined,
      },
    ];
  }, [repoMetrics, benchmarkRepos]);

  const filteredEmails = useMemo(
    () => AVAILABLE_EMAILS.filter((email) => email.toLowerCase().includes(searchQuery.toLowerCase())),
    [searchQuery]
  );

  const toggleEmail = useCallback((email: string) => {
    setSelectedEmails((prev) => (prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedEmails(filteredEmails);
  }, [filteredEmails]);

  const clearAll = useCallback(() => {
    setSelectedEmails([]);
  }, []);

  const transformService = useCallback((originalService: string | null, errorId: number): string => {
    if (!originalService || originalService === "hosting") {
      const services = [
        "nextjs-frontend",
        "api-gateway",
        "auth-service",
        "database",
        "cdn",
        "monitoring",
        "queue-worker",
        "file-storage",
        "search-service",
        "notification-service",
        "payment-processor",
        "analytics-service",
        "cache-redis",
        "email-service",
        "webhook-handler",
      ];
      return services[errorId % services.length];
    }
    return originalService;
  }, []);

  const loadErrorsSummary = useCallback(async (): Promise<ErrorsSummary | null> => {
    try {
      setErrorsSummaryLoading(true);
      setErrorsSummary(null);

      // Resolve repository id
      const { data: repoRows, error: repoError } = await supabase
        .from("repositories")
        .select("id")
        .eq("owner", selectedRepository.owner)
        .eq("name", selectedRepository.name)
        .limit(1);
      if (repoError) throw repoError;
      const repoId = repoRows && repoRows.length > 0 ? (repoRows[0] as any).id as string : null;
      if (!repoId) {
        setErrorsSummary({ total: 0, byService: [], byEnv: [], timeline: [], recent: [], topMessages: [] });
        return { total: 0, byService: [], byEnv: [], timeline: [], recent: [], topMessages: [] };
      }

      const since = new Date();
      since.setDate(since.getDate() - 7);
      const { data: errorRows, error: errorsErr } = await supabase
        .from("datadog_errors")
        .select("*")
        .eq("repository_id", repoId)
        .gte("occurred_at", since.toISOString())
        .order("occurred_at", { ascending: false })
        .limit(500);
      if (errorsErr) throw errorsErr;
      const errors: DatadogError[] = (errorRows as any) || [];

      if (!errors.length) {
        const empty: ErrorsSummary = { total: 0, byService: [], byEnv: [], timeline: [], recent: [], topMessages: [] };
        setErrorsSummary(empty);
        return empty;
      }

      const byServiceMap = new Map<string, number>();
      const byEnvMap = new Map<string, number>();
      const byDateMap = new Map<string, number>();
      const byMessageMap = new Map<string, number>();

      const normalizeHour = (iso: string) => {
        const date = new Date(iso);
        return date.toISOString().slice(0, 13) + ":00:00Z";
      };
      const normalizeMessage = (msg: string | null) => (msg ? msg.trim() : "<no message>");

      for (const e of errors) {
        const service = transformService(e.service, (e as any).id as number);
        const env = (e as any).env || "unknown";
        const hour = normalizeHour((e as any).occurred_at as string);
        const message = normalizeMessage((e as any).message as string | null);
        byServiceMap.set(service, (byServiceMap.get(service) || 0) + 1);
        byEnvMap.set(env, (byEnvMap.get(env) || 0) + 1);
        byDateMap.set(hour, (byDateMap.get(hour) || 0) + 1);
        byMessageMap.set(message, (byMessageMap.get(message) || 0) + 1);
      }

      // Build continuous hourly timeline for last 7 days
      const hours: string[] = [];
      const start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      for (let i = 0; i < 7 * 24; i++) {
        const d = new Date(start);
        d.setHours(start.getHours() + i);
        hours.push(d.toISOString().slice(0, 13) + ":00:00Z");
      }
      const timeline = hours.map((h) => ({
        date: new Date(h).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", hour12: true }),
        count: byDateMap.get(h) || 0,
      }));

      const mapToSortedArray = (m: Map<string, number>) =>
        Array.from(m.entries())
          .map(([category, value]) => ({ category, value }))
          .sort((a, b) => b.value - a.value);

      const byService = mapToSortedArray(byServiceMap).slice(0, 10);
      const byEnv = mapToSortedArray(byEnvMap).slice(0, 10);
      const topMessages = Array.from(byMessageMap.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      // Deduplicate recent by normalized message + service + status to avoid flooding
      const seenRecent = new Set<string>();
      const recent: DatadogError[] = [];
      for (const e of errors) {
        if (recent.length >= 12) break;
        const key = `${normalizeMessage((e as any).message as string | null)}|${transformService(e.service, (e as any).id as number)}|${(e as any).status ?? ""}`;
        if (seenRecent.has(key)) continue;
        seenRecent.add(key);
        recent.push(e as DatadogError);
      }

      const summary: ErrorsSummary = { total: errors.length, byService, byEnv, timeline, recent, topMessages };
      setErrorsSummary(summary);
      return summary;
    } catch (e) {
      setErrorsSummary(null);
      return null;
    } finally {
      setErrorsSummaryLoading(false);
    }
  }, [selectedRepository, transformService]);

  const handleOpenReportModal = useCallback(() => {
    setReportResult(null);
    setShowReportModal(true);
    // best-effort prefetch of errors summary
    void loadErrorsSummary();
  }, [loadErrorsSummary]);

  const buildReportPayload = useCallback(async (): Promise<ReportPayload> => {
    const errors = errorsSummary ?? (await loadErrorsSummary());
    return {
      repository: { owner: selectedRepository.owner, name: selectedRepository.name },
      latestSync,
      health: healthSummary,
      actionQueue: actionGroups.map((g) => ({ key: g.key, title: g.title, count: g.prs.length })),
      developers: {
        top: topDevelopers.slice(0, 3).map((d) => ({ author: d.author, overallScore: d.overallScore })),
        needsAttention: improvementCandidates.slice(0, 3).map((d) => ({ author: d.author, overallScore: d.overallScore })),
      },
      benchmarks: {
        speed: comparisonSpeedData,
        quality: comparisonQualityData,
      },
      distributions: { prSizeDistribution },
      chartsSummary: { sizeVsTimePoints: sizeVsTimeData.length, reviewVsMergePoints: reviewVsMergeData.length },
      errors: errors,
    };
  }, [errorsSummary, loadErrorsSummary, selectedRepository, latestSync, healthSummary, actionGroups, topDevelopers, improvementCandidates, comparisonSpeedData, comparisonQualityData, prSizeDistribution, sizeVsTimeData, reviewVsMergeData]);

  const handleSendReport = useCallback(async () => {
    if (selectedEmails.length === 0) {
      setReportResult({ success: false, message: "Please select at least one recipient" });
      return;
    }
    setSendingReport(true);
    setReportResult(null);
    try {
      const payload = await buildReportPayload();
      const res = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: selectedEmails, payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportResult({ success: false, message: data?.error || "Failed to send report" });
        return;
      }
      setReportResult({ success: true, message: data?.message || "Report sent" });
      setTimeout(() => {
        setShowReportModal(false);
        setSelectedEmails([]);
      }, 1500);
    } catch (e) {
      setReportResult({ success: false, message: "Failed to send report" });
    } finally {
      setSendingReport(false);
    }
  }, [selectedEmails, buildReportPayload]);

  const handleRepositoryChange = useCallback(
    (owner: string, name: string) => {
      router.push(buildRepositoryUrl(owner, name));
    },
    [router]
  );

  return (
    <CopilotSidebar
      instructions={COPILOT_INSTRUCTIONS}
      labels={COPILOT_LABELS}
      defaultOpen={false}
    >
      <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
          <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
          <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
          <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
          <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

          <header className="sticky top-0 z-50 border-b border-[var(--hud-border)] bg-[var(--hud-bg)]/95 backdrop-blur-sm">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-8 py-5">
              <div className="flex flex-wrap items-center gap-4">
                <Image
                  src="/logo.png"
                  alt="Kaizen"
                  width={140}
                  height={40}
                  className="h-10 w-auto opacity-90"
                />
                <div className="hidden h-8 w-px bg-[var(--hud-border)] md:block" />
                <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--hud-text-dim)]">
                  <span className="text-[var(--hud-accent)]">▸</span>{" "}
                  {`${selectedRepository.owner}/${selectedRepository.name}`.toUpperCase()}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-mono text-xs text-[var(--hud-text-dim)] uppercase tracking-wider">
                Last Sync:{" "}
                {latestSync ? formatDateTime(latestSync).toUpperCase() : "—"}
              </div>
              <div className="hidden h-8 w-px bg-[var(--hud-border)] sm:block" />
              <RepositorySelector
                repositories={repositories}
                selectedOwner={selectedRepository.owner}
                selectedName={selectedRepository.name}
                onChange={handleRepositoryChange}
              />
              <button
                type="button"
                onClick={loadData}
                className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={loading}
              >
                {loading ? "Syncing…" : "Sync Data"}
              </button>
              <button
                type="button"
                onClick={handleOpenReportModal}
                className="border border-[var(--hud-warning)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)] transition-all duration-200 hover:bg-[var(--hud-warning)] hover:text-[var(--hud-bg)]"
              >
                Send Report
              </button>
            </div>
            <div className="hidden h-8 w-px bg-[var(--hud-border)] sm:block" />
            <RepositorySelector
              repositories={repositories}
              selectedOwner={selectedRepository.owner}
              selectedName={selectedRepository.name}
              onChange={handleRepositoryChange}
            />
            <button
              type="button"
              onClick={loadData}
              className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={loading}
            >
              {loading ? "Syncing…" : "Sync Data"}
            </button>
            <button
              type="button"
              onClick={handleOpenReportModal}
              className="border border-[var(--hud-warning)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)] transition-all duration-200 hover:bg-[var(--hud-warning)] hover:text-[var(--hud-bg)]"
            >
              Send Report
            </button>
            <button
              type="button"
              onClick={() => router.push("/feedback")}
              className="border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
            >
              Feedback
            </button>
          </div>
        </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-8 py-12">
        <section className="hud-panel hud-corner hud-scanline p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                ◢ Control Center
              </div>
              <h1 className="text-4xl font-semibold text-[var(--hud-text-bright)]">
                Delivery Control Tower
              </h1>
              <p className="max-w-3xl text-sm text-[var(--hud-text-dim)]">
                One view of how quickly we ship, where work is stalling, and which teammates need support. Built for the engineering manager to steer the Supabase platform team.
              </p>
            </div>
            <div className="min-w-[220px] rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 text-right">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Viewing Repository
              </p>
              <p className="mt-2 font-mono text-sm text-[var(--hud-text-bright)]">
                {selectedRepository.owner}/{selectedRepository.name}
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="hud-panel hud-corner border border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/15 px-4 py-3 text-sm text-[var(--hud-text-bright)]">
            {error}
          </div>
        )}

        {loading && prs.length === 0 ? (
          <div className="hud-panel hud-corner p-12 text-center text-sm text-[var(--hud-text-dim)]">
            Loading data for the control tower…
          </div>
        ) : (
          <>
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <div className="hud-panel hud-corner p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                      Team delivery health
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">
                      {healthSummary.summary}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                      Composite score
                    </p>
                    <p className="text-4xl font-semibold text-[var(--hud-accent)]">
                      {healthSummary.healthScore !== null ? healthSummary.healthScore : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  <SummaryStat
                    label="Throughput / week"
                    value={healthSummary.throughputPerWeek !== null ? `${healthSummary.throughputPerWeek.toFixed(1)}` : "—"}
                    suffix=" PRs"
                  />
                  <SummaryStat
                    label="Active contributors"
                    value={healthSummary.activeContributors !== null ? formatInteger(healthSummary.activeContributors) : "—"}
                  />
                  <SummaryStat
                    label="Avg first review"
                    value={formatHours(healthSummary.avgTimeToFirstReview)}
                  />
                  <SummaryStat
                    label="Avg merge time"
                    value={formatHours(healthSummary.avgMergeHours)}
                  />
                  <SummaryStat
                    label="Merge rate"
                    value={formatPercent(healthSummary.mergeRate)}
                  />
                  <SummaryStat
                    label="Small PR share"
                    value={formatPercent(healthSummary.smallPRShare)}
                  />
                </div>

                <div className="mt-6">
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                    Open PR backlog
                  </p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {healthSummary.backlogBuckets.map((bucket) => (
                      <BacklogPill
                        key={bucket.label}
                        label={bucket.label}
                        count={bucket.count}
                        total={healthSummary.openPrCount}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <FocusList
                  title="Focus this sprint"
                  items={healthSummary.focusAreas}
                  emptyLabel="No urgent risks detected"
                  tone="warning"
                />
                <FocusList
                  title="What’s working"
                  items={healthSummary.wins}
                  emptyLabel="We need more data to celebrate wins"
                  tone="positive"
                />
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">
                Action queue
              </h2>
              {actionGroups.length === 0 ? (
                <div className="hud-panel hud-corner p-6 text-sm text-[var(--hud-text-dim)]">
                  No blocking pull requests right now. Keep the flow moving.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-3">
                  {actionGroups.map((group) => (
                    <ActionGroupCard key={group.key} group={group} />
                  ))}
                </div>
              )}
            </section>

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
                      onClick={() => setSelectedDeveloper(dev.author)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                        selectedDeveloper === dev.author
                          ? "border-[var(--hud-accent)]/50 bg-[var(--hud-accent)]/10"
                          : "border-[var(--hud-border)] bg-[var(--hud-bg)] hover:border-[var(--hud-accent)]/40 hover:bg-[var(--hud-bg-elevated)]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--hud-text-bright)]">
                          {dev.author}
                        </p>
                        <p className="text-xs text-[var(--hud-text-dim)]">
                          Overall {dev.overallScore}
                        </p>
                      </div>
                      <span className="font-mono text-lg font-semibold text-[var(--hud-accent)]">
                        #{index + 1}
                      </span>
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
                        <p className="text-sm font-medium text-[var(--hud-text-bright)]">
                          {dev.author}
                        </p>
                        <p className="text-xs text-[var(--hud-text-dim)]">
                          Score {dev.overallScore}
                        </p>
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
                      data={developerRadarData}
                      title={selectedDeveloper ? `${selectedDeveloper} - efficiency profile` : "Efficiency profile"}
                      name={selectedDeveloper || "Developer"}
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

            <section>
              <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">
                Workflow signals
              </h2>
              <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                <div className="h-[360px] hud-panel hud-corner p-4">
                  <ScatterChartViz
                    data={sizeVsTimeData}
                    xLabel="PR size (additions + deletions)"
                    yLabel="Time to merge"
                    title="PR size vs merge time"
                    xUnit=" lines"
                    yUnit=" h"
                  />
                </div>
                <div className="h-[360px] hud-panel hud-corner p-4">
                  <ScatterChartViz
                    data={reviewVsMergeData}
                    xLabel="Time to first review"
                    yLabel="Time to merge"
                    title="Review responsiveness"
                    xUnit=" h"
                    yUnit=" h"
                  />
                </div>
                <div className="h-[360px] hud-panel hud-corner p-4">
                  <DistributionChart
                    data={prSizeDistribution}
                    title="PR size distribution"
                    yLabel="Number of PRs"
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="h-[420px] hud-panel hud-corner p-4">
                <ComparisonBarChart
                  data={comparisonSpeedData}
                  title="Cycle time vs industry"
                  yLabel="Hours"
                  valueUnit=""
                  lowerIsBetter
                />
              </div>
              <div className="h-[420px] hud-panel hud-corner p-4">
                <ComparisonBarChart
                  data={comparisonQualityData}
                  title="Quality signals vs industry"
                  yLabel="Value"
                />
              </div>
            </section>

            {comparisonInsights.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">
                  Benchmark insights
                </h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  {comparisonInsights.map((insight) => (
                    <InsightCard key={insight.metric} insight={insight} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <DatadogErrorsSection owner={selectedRepository.owner} name={selectedRepository.name} />
            </section>
          </>
        )}
      </main>
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowReportModal(false)} />
          <div className="relative z-10 w-full max-w-3xl hud-panel hud-corner p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[var(--hud-text-bright)]">Send Delivery Report</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-[var(--hud-text-dim)] hover:text-[var(--hud-text)]"
              >
                ×
              </button>
            </div>

            <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
              <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Selected Recipients ({selectedEmails.length})
              </div>
              {selectedEmails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedEmails.map((email) => (
                    <div key={email} className="flex items-center gap-2 rounded-md border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10 px-3 py-1.5 text-sm">
                      <span className="text-[var(--hud-text)]">{email}</span>
                      <button
                        type="button"
                        onClick={() => toggleEmail(email)}
                        className="text-[var(--hud-accent)] hover:text-[var(--hud-text-bright)]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--hud-text-dim)]">No recipients selected</p>
              )}
            </div>

            <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 text-sm text-[var(--hud-text)] transition-all duration-200 focus:border-[var(--hud-accent)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={selectAll}
                  className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-danger)]/60 hover:text-[var(--hud-danger)]"
                >
                  Clear All
                </button>
              </div>

              <div className="max-h-72 space-y-2 overflow-y-auto">
                {filteredEmails.map((email) => {
                  const isSelected = selectedEmails.includes(email);
                  const isRealEmail = email === "javokhir@raisedash.com";
                  return (
                    <button
                      key={email}
                      type="button"
                      onClick={() => toggleEmail(email)}
                      className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                        isSelected ? "border-[var(--hud-accent)]/50 bg-[var(--hud-accent)]/10" : "border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] hover:border-[var(--hud-accent)]/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? "border-[var(--hud-accent)] bg-[var(--hud-accent)]" : "border-[var(--hud-border)] bg-[var(--hud-bg)]"}`}>
                          {isSelected && (
                            <svg className="h-3 w-3 text-[var(--hud-bg)]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-[var(--hud-text)]">{email}</span>
                        {isRealEmail && (
                          <span className="rounded-full border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-accent)]">Real</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                  Repository: {selectedRepository.owner}/{selectedRepository.name} • Latest Sync: {latestSync ? formatDateTime(latestSync) : "—"}
                </p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
                  Errors: {errorsSummaryLoading ? "Loading…" : errorsSummary ? `${errorsSummary.total} in 7d` : "Unavailable"}
                </p>
              </div>
            </div>

            {reportResult && (
              <div className={`mb-4 rounded-lg border p-3 ${reportResult.success ? "border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10" : "border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/10"}`}>
                <p className={`${reportResult.success ? "text-[var(--hud-accent)]" : "text-[var(--hud-danger)]"}`}>{reportResult.message}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendReport}
                disabled={sendingReport || selectedEmails.length === 0}
                className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-accent)] px-6 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-bg)] transition-all duration-200 hover:bg-[var(--hud-accent-dim)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sendingReport ? "Sending…" : `Send Report (${selectedEmails.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </CopilotSidebar>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
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

function BacklogPill({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
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

function FocusList({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  tone: "warning" | "positive";
}) {
  const accentText = tone === "warning" ? "text-[#ffaa00]" : "text-[var(--hud-accent)]";
  const accentBorder = tone === "warning" ? "border-[#ffaa00]/40" : "border-[var(--hud-accent)]/40";
  const accentBackground = tone === "warning" ? "bg-[#ffaa00]/5" : "bg-[var(--hud-accent)]/5";

  return (
    <div className={`hud-panel hud-corner p-5 ${accentBorder} ${accentBackground}`}>
      <p className={`font-mono text-xs uppercase tracking-wider ${accentText}`}>{title}</p>
      <div className="mt-3 space-y-2 text-sm text-[var(--hud-text)]">
        {items.length === 0 ? (
          <p className="text-[var(--hud-text-dim)]">{emptyLabel}</p>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-3">
              <span className={`font-mono text-sm ${accentText}`}>▹</span>
              <p>{item}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ActionGroupCard({ group }: { group: ActionGroup }) {
  return (
    <div className="flex flex-col gap-3 hud-panel hud-corner p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            {group.title}
          </p>
          <p className="mt-1 text-sm text-[var(--hud-text)]">{group.description}</p>
        </div>
        <span className="rounded-full border border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10 px-3 py-1 font-mono text-xs uppercase tracking-wide text-[var(--hud-accent)]">
          {group.prs.length}
        </span>
      </div>
      <div className="space-y-3">
        {group.prs.map((pr) => (
          <PRListItem key={pr.id ?? pr.pr_number} pr={pr} />
        ))}
      </div>
    </div>
  );
}

function PRListItem({ pr }: { pr: PullRequest }) {
  const size = (pr.additions ?? 0) + (pr.deletions ?? 0);
  return (
    <a
      href={pr.html_url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg)] px-4 py-3 transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:bg-[var(--hud-bg-elevated)]"
    >
      <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
        <span>PR #{pr.pr_number}</span>
        <span>{formatRelativeDate(pr.updated_at)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-[var(--hud-text-bright)]">
        {pr.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--hud-text-dim)]">
        <span>{pr.author || "unknown"}</span>
        <span>•</span>
        <span>{formatInteger(pr.changed_files)} files</span>
        <span>•</span>
        <span>{formatInteger(size)} lines</span>
      </div>
    </a>
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
        <h3 className="text-sm font-semibold text-[var(--hud-text-bright)]">
          {title}
        </h3>
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

function InsightCard({ insight }: { insight: ComparisonInsight }) {
  return (
    <div className="hud-panel hud-corner p-5">
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-[var(--hud-text-bright)]">
          {insight.metric}
        </h3>
        <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)]">
          {insight.percentile}th pct
        </span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-[var(--hud-text)]">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Your
          </p>
          <p className="mt-1 font-semibold text-[var(--hud-text-bright)]">
            {insight.yourValue.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Median
          </p>
          <p className="mt-1">{insight.industryMedian.toFixed(1)}</p>
        </div>
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Top 10%
          </p>
          <p className="mt-1 text-[var(--hud-accent)]">
            {insight.industryTop10.toFixed(1)}
          </p>
        </div>
      </div>
      <p className="mt-4 text-sm text-[var(--hud-text)]">{insight.interpretation}</p>
    </div>
  );
}

function RepositorySelector({
  repositories,
  selectedOwner,
  selectedName,
  onChange,
}: {
  repositories: RepositoryOption[];
  selectedOwner: string;
  selectedName: string;
  onChange: (owner: string, name: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedRepo = repositories.find(
    (repo) => repo.owner === selectedOwner && repo.name === selectedName
  );
  const label = selectedRepo
    ? selectedRepo.fullName
    : `${selectedOwner}/${selectedName}`;

  if (repositories.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-text)] transition-all duration-200 hover:border-[var(--hud-accent)]/60 hover:text-[var(--hud-text-bright)]"
      >
        <span>{label.toUpperCase()}</span>
        <svg
          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-[var(--hud-border)] bg-[var(--hud-bg)] shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
            <div className="max-h-96 overflow-y-auto p-2">
              {repositories.map((repo) => {
                const isSelected =
                  repo.owner === selectedOwner && repo.name === selectedName;
                const isDefault =
                  repo.owner === DEFAULT_REPO.owner &&
                  repo.name === DEFAULT_REPO.name;

                return (
                  <button
                    key={repo.fullName}
                    type="button"
                    onClick={() => {
                      onChange(repo.owner, repo.name);
                      setIsOpen(false);
                    }}
                    className={`w-full rounded-lg border border-transparent px-3 py-2 text-left font-mono text-xs uppercase tracking-wider transition-all duration-150 ${
                      isSelected
                        ? "border-[var(--hud-accent)]/40 bg-[var(--hud-accent)]/10 text-[var(--hud-text-bright)]"
                        : "text-[var(--hud-text)] hover:border-[var(--hud-border)] hover:bg-[var(--hud-bg-elevated)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {repo.fullName}
                        {isDefault && (
                          <span className="ml-2 rounded-full border border-[var(--hud-accent)]/30 bg-[var(--hud-accent)]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--hud-accent)]">
                            Your team
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <svg
                          className="h-4 w-4 text-[var(--hud-accent)]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    {repo.description && (
                      <p className="mt-1 line-clamp-1 text-[10px] text-[var(--hud-text-dim)]">
                        {repo.description}
                      </p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--hud-text-dim)]">
                      {repo.prCount !== undefined && (
                        <span>{formatInteger(repo.prCount)} PRs</span>
                      )}
                      {repo.contributorCount !== undefined && (
                        <span>{repo.contributorCount} contributors</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function computeTeamHealth(
  repoMetrics: RepositoryMetrics | undefined,
  prs: PullRequest[]
): HealthSummary {
  const openPrs = prs.filter((pr) => pr.state === "open");
  const backlogBuckets = bucketOpenPrs(openPrs);

  if (!repoMetrics) {
    return {
      healthScore: null,
      summary: "Waiting for metrics — trigger a sync",
      throughputPerWeek: null,
      mergeRate: null,
      avgMergeHours: null,
      avgTimeToFirstReview: null,
      avgReviewsPerPR: null,
      activeContributors: null,
      smallPRShare: null,
      largePRShare: null,
      openPrCount: openPrs.length,
      stalePrCount: openPrs.filter((pr) => hoursSince(pr.updated_at) > 72).length,
      backlogBuckets,
      wins: [],
      focusAreas: [],
    };
  }

  const throughputPerWeek = repoMetrics.data_span_days
    ? repoMetrics.total_prs /
      Math.max(repoMetrics.data_span_days / 7, 1)
    : null;
  const mergeRate = repoMetrics.merge_rate_percent ?? null;
  const avgMergeHours = repoMetrics.avg_merge_hours ?? null;
  const avgTimeToFirstReview =
    repoMetrics.avg_time_to_first_review_hours ?? null;
  const avgReviewsPerPR = repoMetrics.avg_reviews_per_pr ?? null;
  const activeContributors = repoMetrics.active_contributors ?? null;
  const smallPRShare = repoMetrics.total_prs
    ? (repoMetrics.small_prs / repoMetrics.total_prs) * 100
    : null;
  const largePRShare = repoMetrics.total_prs
    ? (repoMetrics.large_prs / repoMetrics.total_prs) * 100
    : null;

  const throughputScore =
    throughputPerWeek !== null
      ? Math.min(100, (throughputPerWeek / 20) * 100)
      : 60;
  const mergeRateScore =
    mergeRate !== null ? Math.min(100, (mergeRate / 90) * 100) : 60;
  const mergeTimeScore =
    avgMergeHours !== null
      ? Math.max(0, 100 - (avgMergeHours / 48) * 100)
      : 60;
  const reviewTimeScore =
    avgTimeToFirstReview !== null
      ? Math.max(0, 100 - (avgTimeToFirstReview / 12) * 100)
      : 60;

  const healthScore = Math.round(
    mergeRateScore * 0.3 +
      mergeTimeScore * 0.3 +
      reviewTimeScore * 0.2 +
      throughputScore * 0.2
  );

  let summary = "";
  if (healthScore >= 80) {
    summary = "Delivery is healthy — keep the cadence";
  } else if (healthScore >= 65) {
    summary = "Steady delivery, but cycle times can tighten";
  } else {
    summary = "Delivery risk is rising — focus on reviews & merges";
  }

  const wins: string[] = [];
  const focusAreas: string[] = [];

  if (mergeRate !== null && mergeRate >= 85) {
    wins.push(`Merge rate is strong at ${mergeRate.toFixed(1)}%.`);
  }
  if (avgTimeToFirstReview !== null && avgTimeToFirstReview <= 12) {
    wins.push(`First reviews land in ${avgTimeToFirstReview.toFixed(1)}h on average.`);
  }
  if (smallPRShare !== null && smallPRShare >= 60) {
    wins.push(`${Math.round(smallPRShare)}% of PRs are small and easy to review.`);
  }
  if (throughputPerWeek !== null && throughputPerWeek >= 15) {
    wins.push(`Team ships roughly ${throughputPerWeek.toFixed(1)} PRs per week.`);
  }

  const stalePrCount = openPrs.filter((pr) => hoursSince(pr.updated_at) > 72).length;
  if (avgMergeHours !== null && avgMergeHours > 48) {
    focusAreas.push(`Avg merge time is ${avgMergeHours.toFixed(1)}h — target < 48h.`);
  }
  if (avgTimeToFirstReview !== null && avgTimeToFirstReview > 16) {
    focusAreas.push(`First review waits ${avgTimeToFirstReview.toFixed(1)}h — aim for < 12h.`);
  }
  if (stalePrCount > 0) {
    focusAreas.push(`${stalePrCount} open PR${stalePrCount === 1 ? "" : "s"} idle > 3 days.`);
  }
  if (largePRShare !== null && largePRShare > 20) {
    focusAreas.push(`${Math.round(largePRShare)}% of PRs are large — encourage smaller chunks.`);
  }

  return {
    healthScore,
    summary,
    throughputPerWeek,
    mergeRate,
    avgMergeHours,
    avgTimeToFirstReview,
    avgReviewsPerPR,
    activeContributors,
    smallPRShare,
    largePRShare,
    openPrCount: openPrs.length,
    stalePrCount,
    backlogBuckets,
    wins,
    focusAreas,
  };
}

function buildActionGroups(prs: PullRequest[]): ActionGroup[] {
  const openPrs = prs.filter((pr) => pr.state === "open");
  const stale = openPrs
    .filter((pr) => hoursSince(pr.updated_at) > 72)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
    .slice(0, 5);
  const waitingForReview = openPrs
    .filter(
      (pr) =>
        (pr.reviews_count ?? 0) === 0 &&
        (pr.review_comments_count ?? 0) === 0 &&
        hoursSince(pr.created_at) > 24
    )
    .slice(0, 5);
  const large = openPrs
    .filter((pr) => (pr.additions ?? 0) + (pr.deletions ?? 0) > 1200)
    .sort(
      (a, b) =>
        (b.additions ?? 0) + (b.deletions ?? 0) -
        ((a.additions ?? 0) + (a.deletions ?? 0))
    )
    .slice(0, 5);

  const groups: ActionGroup[] = [];

  if (stale.length) {
    groups.push({
      key: "stale",
      title: "Stuck > 3 days",
      description: "These PRs haven't seen movement in 72h+. Help them land.",
      prs: stale,
    });
  }
  if (waitingForReview.length) {
    groups.push({
      key: "review",
      title: "Waiting for first review",
      description: "No review engagement yet. Rally reviewers.",
      prs: waitingForReview,
    });
  }
  if (large.length) {
    groups.push({
      key: "large",
      title: "High-risk large PRs",
      description: "Break down or swarm review to reduce risk.",
      prs: large,
    });
  }

  return groups;
}

function bucketOpenPrs(prs: PullRequest[]): { label: string; count: number }[] {
  const buckets = [
    { label: "≤24h", count: 0 },
    { label: "1-3d", count: 0 },
    { label: "3-7d", count: 0 },
    { label: ">7d", count: 0 },
  ];

  const now = Date.now();

  prs.forEach((pr) => {
    const created = new Date(pr.created_at).getTime();
    if (Number.isNaN(created)) {
      buckets[0].count += 1;
      return;
    }
    const diffHours = (now - created) / (1000 * 60 * 60);

    if (diffHours <= 24) buckets[0].count += 1;
    else if (diffHours <= 72) buckets[1].count += 1;
    else if (diffHours <= 168) buckets[2].count += 1;
    else buckets[3].count += 1;
  });

  return buckets;
}

function computeLatestSync(prs: PullRequest[]): string | null {
  if (!prs.length) return null;
  return prs.reduce<string | null>((latest, pr) => {
    if (!pr.synced_at) return latest;
    if (!latest) return pr.synced_at;
    return new Date(pr.synced_at) > new Date(latest) ? pr.synced_at : latest;
  }, null);
}

function hoursSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatInteger(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US").format(value);
}

function formatHours(hours: number | null): string {
  if (hours === null || Number.isNaN(hours)) {
    return "—";
  }
  if (hours < 24) {
    return `${hours.toFixed(1)}h`;
  }
  const days = Math.floor(hours / 24);
  const remainderHours = Math.round(hours - days * 24);
  if (remainderHours === 0) {
    return `${days}d`;
  }
  return `${days}d ${remainderHours}h`;
}

function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
}

function formatRelativeDate(iso: string): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;

  return parsed.toLocaleDateString();
}
