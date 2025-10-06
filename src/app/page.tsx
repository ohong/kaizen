"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CopilotSidebar } from "@copilotkit/react-ui";

import {
  ActionQueueSection,
  AddRepositoryModal,
  ControlTowerHero,
  DashboardHeader,
  DeveloperInsightsSection,
  TeamScoreGrid,
  GuidedActionsPanel,
  HealthOverviewSection,
  OverviewSection,
  ReportModal,
} from "@/components/dashboard";
import { WidgetizedErrorsSection } from "@/components/widgets/WidgetizedErrorsSection";
import { WidgetizedWorkflowSection } from "@/components/widgets/WidgetizedWorkflowSection";
import { WidgetizedBenchmarksSection } from "@/components/widgets/WidgetizedBenchmarksSection";
import { useRepositoryDashboard } from "@/hooks/useRepositoryDashboard";
import {
  calculateDeveloperEfficiency,
  computeTeamEfficiencySummary,
  generateComparisonInsights,
  generateReviewTimeVsMergeTimeScatter,
  generateSizeVsTimeScatter,
  type ComparisonInsight,
  type DeveloperEfficiency,
  type TeamEfficiencySummary,
} from "@/lib/metrics";
import {
  buildActionGroups,
  computeLatestSync,
  computeTeamHealth,
  median,
  type ActionGroup,
  type HealthSummary,
} from "@/lib/dashboard";
import { fetchErrorsSummary, type ErrorsSummary } from "@/lib/errors";
import { buildRepositoryUrl, parseRepositoryFromUrl } from "@/lib/repository-utils";

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

  const selectedRepository = useMemo(() => parseRepositoryFromUrl(searchParams), [searchParams]);

  const {
    prs,
    developerMetrics,
    repositoryMetrics,
    repositories,
    loading,
    error,
    refresh,
    reloadRepositories,
  } = useRepositoryDashboard(selectedRepository);

  const [selectedDeveloper, setSelectedDeveloper] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddRepoModal, setShowAddRepoModal] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportResult, setReportResult] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [addingRepository, setAddingRepository] = useState(false);
  const [addRepoError, setAddRepoError] = useState<string | null>(null);
  const [errorsSummary, setErrorsSummary] = useState<ErrorsSummary | null>(null);
  const [errorsSummaryLoading, setErrorsSummaryLoading] = useState(false);

  const handleSync = useCallback(() => {
    void refresh();
  }, [refresh]);

  const repoMetrics = useMemo(() => {
    return repositoryMetrics.find(
      (metric) =>
        metric.repository_owner === selectedRepository.owner &&
        metric.repository_name === selectedRepository.name
    );
  }, [repositoryMetrics, selectedRepository]);

  const benchmarkRepos = useMemo(() => {
    return repositoryMetrics.filter(
      (metric) =>
        metric.repository_owner !== selectedRepository.owner ||
        metric.repository_name !== selectedRepository.name
    );
  }, [repositoryMetrics, selectedRepository]);

  const developerEfficiencies = useMemo<DeveloperEfficiency[]>(() => {
    if (!developerMetrics.length || !repositoryMetrics.length) {
      return [];
    }
    return developerMetrics.map((metric) => calculateDeveloperEfficiency(metric, repositoryMetrics));
  }, [developerMetrics, repositoryMetrics]);

  const sortedDevelopers = useMemo<DeveloperEfficiency[]>(() => {
    return [...developerEfficiencies].sort((a, b) => b.overallScore - a.overallScore);
  }, [developerEfficiencies]);

  const teamEfficiency = useMemo<TeamEfficiencySummary | null>(
    () => computeTeamEfficiencySummary(developerEfficiencies),
    [developerEfficiencies]
  );

  useEffect(() => {
    if (!sortedDevelopers.length) {
      setSelectedDeveloper(null);
      return;
    }
    if (!selectedDeveloper || !sortedDevelopers.some((dev) => dev.author === selectedDeveloper)) {
      setSelectedDeveloper(sortedDevelopers[0].author);
    }
  }, [sortedDevelopers, selectedDeveloper]);


  const healthSummary = useMemo<HealthSummary>(() => {
    return computeTeamHealth(repoMetrics, prs);
  }, [repoMetrics, prs]);

  const actionGroups = useMemo<ActionGroup[]>(() => buildActionGroups(prs), [prs]);

  const latestSync = useMemo(() => computeLatestSync(prs), [prs]);

  const prSizeDistribution = useMemo(
    () => {
      if (!repoMetrics) return [] as { category: string; value: number; color: string }[];
      return [
        { category: "Small (≤200 lines)", value: repoMetrics.small_prs, color: "#10b981" },
        { category: "Medium (201-1000)", value: repoMetrics.medium_prs, color: "#f59e0b" },
        { category: "Large (>1000)", value: repoMetrics.large_prs, color: "#ef4444" },
      ];
    },
    [repoMetrics]
  );

  const sizeVsTimeData = useMemo(() => generateSizeVsTimeScatter(prs), [prs]);

  const reviewVsMergeData = useMemo(() => generateReviewTimeVsMergeTimeScatter(prs), [prs]);

  const comparisonInsights = useMemo<ComparisonInsight[]>(() => {
    if (!repoMetrics || !benchmarkRepos.length) return [];
    return generateComparisonInsights(repoMetrics, benchmarkRepos);
  }, [repoMetrics, benchmarkRepos]);

  const comparisonSpeedData = useMemo(() => {
    if (!repoMetrics || !benchmarkRepos.length) return [] as {
      name: string;
      yourTeam: number;
      industryMedian: number;
      topPerformer?: number;
    }[];

    const mergeTimes = benchmarkRepos
      .map((repo) => repo.avg_merge_hours || 0)
      .filter((value) => value > 0);
    const reviewTimes = benchmarkRepos
      .map((repo) => repo.avg_time_to_first_review_hours || 0)
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
    if (!repoMetrics || !benchmarkRepos.length) return [] as {
      name: string;
      yourTeam: number;
      industryMedian: number;
      topPerformer?: number;
    }[];

    const mergeRates = benchmarkRepos.map((repo) => repo.merge_rate_percent || 0);
    const reviewDepths = benchmarkRepos.map((repo) => repo.avg_reviews_per_pr || 0);

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

  const topDevelopers = useMemo(() => sortedDevelopers.slice(0, 5), [sortedDevelopers]);
  const improvementCandidates = useMemo(() => {
    if (sortedDevelopers.length <= 3) {
      return [...sortedDevelopers].reverse();
    }
    return sortedDevelopers.slice(-3).reverse();
  }, [sortedDevelopers]);

  const loadErrorsSummary = useCallback(async (): Promise<ErrorsSummary | null> => {
    try {
      setErrorsSummaryLoading(true);
      const summary = await fetchErrorsSummary(
        selectedRepository.owner,
        selectedRepository.name
      );
      setErrorsSummary(summary);
      return summary;
    } catch {
      setErrorsSummary(null);
      return null;
    } finally {
      setErrorsSummaryLoading(false);
    }
  }, [selectedRepository]);

  const handleOpenReportModal = useCallback(() => {
    setReportResult(null);
    setShowReportModal(true);
    void loadErrorsSummary();
  }, [loadErrorsSummary]);

  const buildReportPayload = useCallback(async (): Promise<ReportPayload> => {
    const errors = errorsSummary ?? (await loadErrorsSummary());
    return {
      repository: { owner: selectedRepository.owner, name: selectedRepository.name },
      latestSync,
      health: healthSummary,
      actionQueue: actionGroups.map((group) => ({
        key: group.key,
        title: group.title,
        count: group.prs.length,
      })),
      developers: {
        top: topDevelopers
          .slice(0, 3)
          .map((developer) => ({ author: developer.author, overallScore: developer.overallScore })),
        needsAttention: improvementCandidates
          .slice(0, 3)
          .map((developer) => ({ author: developer.author, overallScore: developer.overallScore })),
      },
      benchmarks: {
        speed: comparisonSpeedData,
        quality: comparisonQualityData,
      },
      distributions: { prSizeDistribution },
      chartsSummary: {
        sizeVsTimePoints: sizeVsTimeData.length,
        reviewVsMergePoints: reviewVsMergeData.length,
      },
      errors,
    };
  }, [
    errorsSummary,
    loadErrorsSummary,
    selectedRepository,
    latestSync,
    healthSummary,
    actionGroups,
    topDevelopers,
    improvementCandidates,
    comparisonSpeedData,
    comparisonQualityData,
    prSizeDistribution,
    sizeVsTimeData,
    reviewVsMergeData,
  ]);

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
    } catch {
      setReportResult({ success: false, message: "Failed to send report" });
    } finally {
      setSendingReport(false);
    }
  }, [selectedEmails, buildReportPayload]);

  const toggleEmail = useCallback((email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((item) => item !== email) : [...prev, email]
    );
  }, []);

  const handleSelectAll = useCallback((emails: string[]) => {
    setSelectedEmails(emails);
  }, []);

  const handleClearAll = useCallback(() => setSelectedEmails([]), []);

  const handleRepositoryChange = useCallback(
    (owner: string, name: string) => {
      router.push(buildRepositoryUrl(owner, name));
    },
    [router]
  );

  const handleAddRepository = useCallback(
    async ({ owner, name, description, token }: { owner: string; name: string; description?: string; token: string }) => {
      if (!owner || !name) {
        setAddRepoError("Enter both owner and repository name.");
        return;
      }
      if (!token) {
        setAddRepoError("Provide a GitHub personal access token with repo read access.");
        return;
      }
      setAddingRepository(true);
      setAddRepoError(null);
      try {
        const response = await fetch("/api/repositories/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ owner, name, description, token }),
        });
        const data = await response.json();
        if (!response.ok || !data?.success) {
          setAddRepoError(data?.error || "Unable to add repository.");
          return;
        }
        await reloadRepositories();
        setShowAddRepoModal(false);
        setSelectedDeveloper(null);
        handleRepositoryChange(owner, name);
      } catch (err) {
        console.error("Add repository error", err);
        setAddRepoError("Failed to add repository. Check the repo name and token permissions.");
      } finally {
        setAddingRepository(false);
      }
    },
    [handleRepositoryChange, reloadRepositories]
  );

  const handleOpenAddRepoModal = useCallback(() => {
    setAddRepoError(null);
    setShowAddRepoModal(true);
  }, []);

  const handleNavigateToFeedback = useCallback(() => {
    router.push("/feedback");
  }, [router]);

  const handleNavigateToIntegrations = useCallback(() => {
    router.push("/integrations");
  }, [router]);

  return (
    <CopilotSidebar
      clickOutsideToClose={false}
      defaultOpen={true}
      labels={{
        title: "Kaizen Copilot",
        initial: "I can benchmark repos, compare developer health, and outline improvement plays. Ask for suggestions or type / to see quick prompts."
      }}
    >
      <div className="relative min-h-screen bg-[var(--hud-bg)] text-[var(--hud-text)]">
        <div className="pointer-events-none fixed top-0 left-0 z-0 h-16 w-16 border-l-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed top-0 right-0 z-0 h-16 w-16 border-r-2 border-t-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 left-0 z-0 h-16 w-16 border-b-2 border-l-2 border-[var(--hud-accent)] opacity-30" />
        <div className="pointer-events-none fixed bottom-0 right-0 z-0 h-16 w-16 border-b-2 border-r-2 border-[var(--hud-accent)] opacity-30" />

        <DashboardHeader
          owner={selectedRepository.owner}
          name={selectedRepository.name}
          repositories={repositories}
          loading={loading}
          onSync={handleSync}
          onOpenAddRepository={handleOpenAddRepoModal}
          onOpenReport={handleOpenReportModal}
          onNavigateToFeedback={handleNavigateToFeedback}
          onNavigateToIntegrations={handleNavigateToIntegrations}
          onRepositoryChange={handleRepositoryChange}
        />

        <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-8 py-12">
          <ControlTowerHero owner={selectedRepository.owner} name={selectedRepository.name} />

          <OverviewSection
            repository={selectedRepository}
            wins={healthSummary.wins}
            focusAreas={healthSummary.focusAreas}
            actionGroups={actionGroups}
          />

          {error && (
            <div className="hud-panel hud-corner border border-[var(--hud-danger)]/40 bg-[var(--hud-danger)]/15 px-4 py-3 text-sm text-[var(--hud-text-bright)]">
              {error}
            </div>
          )}

          <GuidedActionsPanel
            onAddRepository={handleOpenAddRepoModal}
            onSync={handleSync}
            onOpenReport={handleOpenReportModal}
          />

          {loading && prs.length === 0 ? (
            <div className="hud-panel hud-corner p-12 text-center text-sm text-[var(--hud-text-dim)]">
              Loading data for the control tower…
            </div>
          ) : (
            <>
              <section className="flex flex-col gap-6">
                <header className="space-y-2">
                  <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Metrics</h2>
                  <p className="max-w-3xl text-sm text-[var(--hud-text-dim)]">
                    Track delivery health, flow efficiency, and how you compare to benchmarks.
                  </p>
                </header>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
                  <div className="lg:w-[70%]">
                    <HealthOverviewSection summary={healthSummary} className="h-full" />
                  </div>
                  <div className="lg:w-[30%]">
                    <TeamScoreGrid summary={teamEfficiency} className="h-full" />
                  </div>
                </div>
                <div className="flex flex-col gap-8">
                  <WidgetizedWorkflowSection
                    sizeVsTimeData={sizeVsTimeData}
                    reviewVsMergeData={reviewVsMergeData}
                    prSizeDistribution={prSizeDistribution}
                  />
                  <WidgetizedBenchmarksSection
                    speedData={comparisonSpeedData}
                    qualityData={comparisonQualityData}
                    insights={comparisonInsights}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-6">
                <header className="space-y-2">
                  <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Blockers</h2>
                  <p className="max-w-3xl text-sm text-[var(--hud-text-dim)]">
                    Unblock the work and services putting delivery at risk right now.
                  </p>
                </header>
                <div className="flex flex-col gap-8">
                  <ActionQueueSection actionGroups={actionGroups} />
                  <WidgetizedErrorsSection
                    owner={selectedRepository.owner}
                    name={selectedRepository.name}
                  />
                </div>
              </section>

              <section className="flex flex-col gap-6">
                <header className="space-y-2">
                  <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Recommendations</h2>
                  <p className="max-w-3xl text-sm text-[var(--hud-text-dim)]">
                    Coaching cues and focus areas for your engineers based on recent activity.
                  </p>
                </header>
                <DeveloperInsightsSection
                  developers={sortedDevelopers}
                  selectedDeveloper={selectedDeveloper}
                  onSelectDeveloper={setSelectedDeveloper}
                />
              </section>
            </>
          )}
        </main>

        <ReportModal
          open={showReportModal}
          owner={selectedRepository.owner}
          name={selectedRepository.name}
          availableEmails={AVAILABLE_EMAILS}
          selectedEmails={selectedEmails}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleEmail={toggleEmail}
          onSelectAll={handleSelectAll}
          onClearAll={handleClearAll}
          onClose={() => setShowReportModal(false)}
          onSend={handleSendReport}
          sending={sendingReport}
          result={reportResult}
          latestSync={latestSync}
          errorsSummary={errorsSummary}
          errorsLoading={errorsSummaryLoading}
        />

        <AddRepositoryModal
          open={showAddRepoModal}
          submitting={addingRepository}
          error={addRepoError}
          onSubmit={handleAddRepository}
          onClose={() => {
            setShowAddRepoModal(false);
            setAddRepoError(null);
          }}
        />
      </div>
    </CopilotSidebar>
  );
}
