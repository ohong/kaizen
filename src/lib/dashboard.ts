import type { PullRequest, RepositoryMetrics } from "@/lib/types/database";

export interface HealthSummary {
  healthScore: number | null;
  healthPercentile: number | null;
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

export interface ActionGroup {
  key: string;
  title: string;
  description: string;
  prs: PullRequest[];
}

export function computeTeamHealth(
  repoMetrics: RepositoryMetrics | undefined,
  prs: PullRequest[],
): HealthSummary {
  const openPrs = prs.filter((pr) => pr.state === "open");
  const backlogBuckets = bucketOpenPrs(openPrs);

  if (!repoMetrics) {
    return {
      healthScore: null,
      healthPercentile: null,
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
      stalePrCount: openPrs.filter((pr) => hoursSince(pr.updated_at) > 72)
        .length,
      backlogBuckets,
      wins: [],
      focusAreas: [],
    };
  }

  const throughputPerWeek = repoMetrics.data_span_days
    ? repoMetrics.total_prs / Math.max(repoMetrics.data_span_days / 7, 1)
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
    avgMergeHours !== null ? Math.max(0, 100 - (avgMergeHours / 48) * 100) : 60;
  const reviewTimeScore =
    avgTimeToFirstReview !== null
      ? Math.max(0, 100 - (avgTimeToFirstReview / 12) * 100)
      : 60;

  const healthScore = Math.round(
    mergeRateScore * 0.3 +
      mergeTimeScore * 0.3 +
      reviewTimeScore * 0.2 +
      throughputScore * 0.2,
  );
  const healthPercentile = repoMetrics.health_percentile ?? null;

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
    wins.push(
      `First reviews land in ${avgTimeToFirstReview.toFixed(1)}h on average.`,
    );
  }
  if (smallPRShare !== null && smallPRShare >= 60) {
    wins.push(
      `${Math.round(smallPRShare)}% of PRs are small and easy to review.`,
    );
  }
  if (throughputPerWeek !== null && throughputPerWeek >= 15) {
    wins.push(
      `Team ships roughly ${throughputPerWeek.toFixed(1)} PRs per week.`,
    );
  }

  const stalePrCount = openPrs.filter(
    (pr) => hoursSince(pr.updated_at) > 72,
  ).length;
  if (avgMergeHours !== null && avgMergeHours > 48) {
    focusAreas.push(
      `Avg merge time is ${avgMergeHours.toFixed(1)}h — target < 48h.`,
    );
  }
  if (avgTimeToFirstReview !== null && avgTimeToFirstReview > 16) {
    focusAreas.push(
      `First review waits ${avgTimeToFirstReview.toFixed(1)}h — aim for < 12h.`,
    );
  }
  if (stalePrCount > 0) {
    focusAreas.push(
      `${stalePrCount} open PR${stalePrCount === 1 ? "" : "s"} idle > 3 days.`,
    );
  }
  if (largePRShare !== null && largePRShare > 20) {
    focusAreas.push(
      `${Math.round(largePRShare)}% of PRs are large — encourage smaller chunks.`,
    );
  }

  return {
    healthScore,
    healthPercentile,
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

export function buildActionGroups(prs: PullRequest[]): ActionGroup[] {
  const openPrs = prs.filter((pr) => pr.state === "open");
  const stale = openPrs
    .filter((pr) => hoursSince(pr.updated_at) > 72)
    .sort(
      (a, b) =>
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
    )
    .slice(0, 5);
  const waitingForReview = openPrs
    .filter(
      (pr) =>
        (pr.reviews_count ?? 0) === 0 &&
        (pr.review_comments_count ?? 0) === 0 &&
        hoursSince(pr.created_at) > 24,
    )
    .slice(0, 5);
  const large = openPrs
    .filter((pr) => (pr.additions ?? 0) + (pr.deletions ?? 0) > 1200)
    .sort(
      (a, b) =>
        (b.additions ?? 0) +
        (b.deletions ?? 0) -
        ((a.additions ?? 0) + (a.deletions ?? 0)),
    )
    .slice(0, 5);

  const groups: ActionGroup[] = [];

  if (stale.length) {
    groups.push({
      key: "stale",
      title: "Stuck > 3 days",
      description: "These PRs haven't seen movement in 72h+.",
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

export function computeLatestSync(prs: PullRequest[]): string | null {
  if (!prs.length) return null;
  return prs.reduce<string | null>((latest, pr) => {
    if (!pr.synced_at) return latest;
    if (!latest) return pr.synced_at;
    return new Date(pr.synced_at) > new Date(latest) ? pr.synced_at : latest;
  }, null);
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function hoursSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return (Date.now() - timestamp) / (1000 * 60 * 60);
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
