import type { PullRequest, DeveloperMetrics, RepositoryMetrics } from './types/database';

/**
 * Efficiency metrics for interpreting developer performance
 */

export interface EfficiencyScore {
  score: number; // 0-100
  percentile: number; // 0-100
  interpretation: string;
  recommendation: string;
}

export interface DeveloperEfficiency {
  author: string;
  repository_owner: string;
  repository_name: string;
  velocityScore: EfficiencyScore;
  qualityScore: EfficiencyScore;
  collaborationScore: EfficiencyScore;
  consistencyScore: EfficiencyScore;
  throughputScore: EfficiencyScore;
  mergeSpeedScore: EfficiencyScore;
  reviewResponsivenessScore: EfficiencyScore;
  prSizeDisciplineScore: EfficiencyScore;
  mergeSuccessScore: EfficiencyScore;
  overallScore: number;
}

export interface TeamEfficiencySummary {
  velocity: EfficiencyScore;
  quality: EfficiencyScore;
  collaboration: EfficiencyScore;
  consistency: EfficiencyScore;
}

export interface ComparisonInsight {
  metric: string;
  yourValue: number;
  industryMedian: number;
  industryTop10: number;
  percentile: number;
  interpretation: string;
}

/**
 * Calculate velocity score based on PR throughput and cycle time
 */
export function calculateVelocityScore(
  metrics: DeveloperMetrics,
  benchmarks: RepositoryMetrics[]
): EfficiencyScore {
  // PRs per day
  const prsPerDay = metrics.total_prs / (metrics.activity_span_days || 1);

  // Average merge time (lower is better, so invert)
  const avgMergeHours = metrics.avg_merge_hours || 48;
  const mergeScore = Math.max(0, 100 - (avgMergeHours / 72) * 100);

  // Throughput score
  const throughputScore = Math.min(100, (prsPerDay / 0.5) * 100); // 0.5 PRs/day = 100%

  // Combined velocity score
  const score = (mergeScore * 0.6 + throughputScore * 0.4);

  // Calculate percentile relative to benchmarks
  const allAvgMergeHours = benchmarks.map(b => b.avg_merge_hours || 48);
  const percentile = calculatePercentile(avgMergeHours, allAvgMergeHours, true);

  let interpretation = '';
  let recommendation = '';

  if (score >= 80) {
    interpretation = 'Excellent velocity - fast cycle times and high throughput';
    recommendation = 'Maintain current practices and share knowledge with team';
  } else if (score >= 60) {
    interpretation = 'Good velocity with room for improvement';
    recommendation = 'Consider smaller PRs and more focused changes';
  } else if (score >= 40) {
    interpretation = 'Moderate velocity - cycle times could be faster';
    recommendation = 'Break down work into smaller chunks, automate testing';
  } else {
    interpretation = 'Low velocity - significant delays in PR cycle';
    recommendation = 'Focus on smaller PRs, pair programming, and removing blockers';
  }

  return { score, percentile, interpretation, recommendation };
}

/**
 * Calculate quality score based on PR size, merge rate, and review engagement
 */
export function calculateQualityScore(
  metrics: DeveloperMetrics,
  benchmarks: RepositoryMetrics[]
): EfficiencyScore {
  // Merge rate (% of PRs that get merged)
  const mergeRate = metrics.merge_rate_percent || 0;

  // PR size distribution (prefer smaller PRs)
  const totalPRs = metrics.total_prs;
  const smallPRRatio = (metrics.small_prs / totalPRs) * 100;
  const sizeScore = Math.min(100, smallPRRatio * 1.2); // 83% small PRs = 100%

  // Engagement (reviews and comments)
  const engagementScore = Math.min(100, (metrics.avg_engagement || 0) * 20); // 5 comments = 100%

  // Combined quality score
  const score = (mergeRate * 0.4 + sizeScore * 0.35 + engagementScore * 0.25);

  // Calculate percentile
  const allMergeRates = benchmarks.map(b => b.merge_rate_percent || 0);
  const percentile = calculatePercentile(mergeRate, allMergeRates, false);

  let interpretation = '';
  let recommendation = '';

  if (score >= 80) {
    interpretation = 'High quality work - well-scoped PRs with good review engagement';
    recommendation = 'Excellent practices - consider mentoring others';
  } else if (score >= 60) {
    interpretation = 'Good quality with some large or under-reviewed PRs';
    recommendation = 'Aim for smaller, more focused changes';
  } else if (score >= 40) {
    interpretation = 'Moderate quality - PRs may be too large or lack review';
    recommendation = 'Break work into smaller units, engage reviewers earlier';
  } else {
    interpretation = 'Quality needs improvement - large PRs or low merge rate';
    recommendation = 'Focus on incremental changes, seek early feedback';
  }

  return { score, percentile, interpretation, recommendation };
}

/**
 * Calculate collaboration score based on code reviews given and received
 */
export function calculateCollaborationScore(
  metrics: DeveloperMetrics
): EfficiencyScore {
  // Engagement with reviews (comments + review comments)
  const engagement = metrics.avg_engagement || 0;

  // Score based on engagement level
  const score = Math.min(100, engagement * 15); // 6-7 interactions = 100%

  let interpretation = '';
  let recommendation = '';
  let percentile = 50; // Default to median without external data

  if (score >= 80) {
    interpretation = 'Highly collaborative - active in reviews and discussions';
    recommendation = 'Great teamwork - continue fostering collaboration';
    percentile = 90;
  } else if (score >= 60) {
    interpretation = 'Good collaboration with regular engagement';
    recommendation = 'Consider proactive code reviews for teammates';
    percentile = 70;
  } else if (score >= 40) {
    interpretation = 'Moderate collaboration - could engage more in reviews';
    recommendation = 'Increase participation in PR reviews and discussions';
    percentile = 40;
  } else {
    interpretation = 'Limited collaboration - minimal review engagement';
    recommendation = 'Actively review teammates\' PRs and provide feedback';
    percentile = 20;
  }

  return { score, percentile, interpretation, recommendation };
}

/**
 * Calculate consistency score based on PR activity patterns
 */
export function calculateConsistencyScore(
  metrics: DeveloperMetrics
): EfficiencyScore {
  // PRs per day
  const prsPerDay = metrics.total_prs / (metrics.activity_span_days || 1);

  // Ideal range: 0.2-1.0 PRs per day
  let score = 0;
  if (prsPerDay >= 0.2 && prsPerDay <= 1.0) {
    score = 100;
  } else if (prsPerDay < 0.2) {
    score = (prsPerDay / 0.2) * 100;
  } else {
    score = Math.max(0, 100 - ((prsPerDay - 1.0) * 20));
  }

  let interpretation = '';
  let recommendation = '';
  let percentile = 50;

  if (score >= 80) {
    interpretation = 'Consistent contribution pattern - steady delivery';
    recommendation = 'Maintain consistent cadence';
    percentile = 85;
  } else if (score >= 60) {
    interpretation = 'Fairly consistent with some variation';
    recommendation = 'Aim for more regular PR submissions';
    percentile = 65;
  } else if (score >= 40) {
    interpretation = 'Inconsistent contribution pattern';
    recommendation = 'Establish a more regular development rhythm';
    percentile = 35;
  } else {
    interpretation = 'Very inconsistent - either too sparse or too intense';
    recommendation = 'Balance workload and break into manageable chunks';
    percentile = 15;
  }

  score = Math.max(0, Math.min(100, score));

  return { score, percentile, interpretation, recommendation };
}

function calculateThroughputScore(metrics: DeveloperMetrics): EfficiencyScore {
  const activeWeeks = metrics.activity_span_days ? Math.max(metrics.activity_span_days / 7, 1) : 1;
  const prsPerWeek = metrics.total_prs / activeWeeks;
  const score = Math.max(0, Math.min(100, (prsPerWeek / 3) * 100));

  let interpretation = '';
  let recommendation = '';
  if (score >= 85) {
    interpretation = 'High shipping cadence - work is flowing quickly';
    recommendation = 'Protect focus time and keep scope small to sustain the pace';
  } else if (score >= 60) {
    interpretation = 'Steady throughput with room to accelerate';
    recommendation = 'Batch PRs less and aim for daily merges to lift momentum';
  } else if (score >= 40) {
    interpretation = 'Throughput is on the slower side';
    recommendation = 'Break features into smaller milestones and avoid blocked branches';
  } else {
    interpretation = 'Low throughput - shipping cadence is constrained';
    recommendation = 'Review workload and unblock the pipeline before starting more work';
  }

  return {
    score: Math.round(score),
    percentile: estimatePercentileFromScore(score),
    interpretation,
    recommendation,
  };
}

function calculateMergeSpeedScore(metrics: DeveloperMetrics): EfficiencyScore {
  const mergeHours = metrics.avg_merge_hours;
  if (mergeHours === null || Number.isNaN(mergeHours)) {
    return {
      score: 50,
      percentile: 50,
      interpretation: 'Merge speed unknown - no recent merges recorded',
      recommendation: 'Ship a few PRs end-to-end to capture baseline cycle time',
    };
  }

  const score = Math.max(0, Math.min(100, 100 - (mergeHours / 48) * 100));

  let interpretation = '';
  let recommendation = '';
  if (score >= 80) {
    interpretation = 'PRs merge fast - reviewers are responsive and scope stays tight';
    recommendation = 'Keep pairing reviewers early to sustain the velocity';
  } else if (score >= 60) {
    interpretation = 'Merge time is fine but could be leaner';
    recommendation = 'Schedule explicit review slots and stagger deploy windows';
  } else if (score >= 40) {
    interpretation = 'Merges are slow, creating delivery drag';
    recommendation = 'Shorten PRs and line up backup reviewers for faster hand-offs';
  } else {
    interpretation = 'Merge delays are severe - work is idling for days';
    recommendation = 'Run a review-swimlane rotation and make WIP limits visible';
  }

  return {
    score: Math.round(score),
    percentile: estimatePercentileFromScore(score),
    interpretation,
    recommendation,
  };
}

function calculateReviewResponsivenessScore(metrics: DeveloperMetrics): EfficiencyScore {
  const firstReviewHours = metrics.avg_time_to_first_review_hours;
  if (firstReviewHours === null || Number.isNaN(firstReviewHours)) {
    return {
      score: 50,
      percentile: 50,
      interpretation: 'Time to first review is unclear - no reviewer data available',
      recommendation: 'Coordinate at least one review per PR to establish a baseline',
    };
  }

  const score = Math.max(0, Math.min(100, 100 - (firstReviewHours / 24) * 100));

  let interpretation = '';
  let recommendation = '';
  if (score >= 80) {
    interpretation = 'Feedback lands within hours - excellent review responsiveness';
    recommendation = 'Keep reviewer rotations lightweight to maintain the SLA';
  } else if (score >= 60) {
    interpretation = 'Reviews arrive in a reasonable window';
    recommendation = 'Block daily review slots to shave a few hours off the wait time';
  } else if (score >= 40) {
    interpretation = 'Reviews take over a day, slowing developer flow';
    recommendation = 'Make review ownership explicit and surface stale PR alerts';
  } else {
    interpretation = 'PRs wait multiple days for feedback';
    recommendation = 'Introduce batched review breaks and escalate blockers quickly';
  }

  return {
    score: Math.round(score),
    percentile: estimatePercentileFromScore(score),
    interpretation,
    recommendation,
  };
}

function calculatePrSizeDisciplineScore(metrics: DeveloperMetrics): EfficiencyScore {
  const total = metrics.total_prs || 0;
  const smallRatio = total > 0 ? metrics.small_prs / total : 0;
  const score = Math.max(0, Math.min(100, smallRatio * 100));

  let interpretation = '';
  let recommendation = '';
  if (score >= 80) {
    interpretation = 'Most PRs are bite-sized and easy to review';
    recommendation = 'Keep championing small changes and merge frequently';
  } else if (score >= 60) {
    interpretation = 'PR size is generally healthy with a few large drops';
    recommendation = 'Split risky work behind feature flags to stay in the sweet spot';
  } else if (score >= 40) {
    interpretation = 'Many PRs are medium-large, raising review load';
    recommendation = 'Co-design increments before coding to prevent scope creep';
  } else {
    interpretation = 'Chunking needs attention - reviewers see monolithic PRs';
    recommendation = 'Adopt working agreements on max PR size and enable draft reviews early';
  }

  return {
    score: Math.round(score),
    percentile: estimatePercentileFromScore(score),
    interpretation,
    recommendation,
  };
}

function calculateMergeSuccessScore(metrics: DeveloperMetrics): EfficiencyScore {
  const mergeRate = metrics.merge_rate_percent ?? 0;
  const score = Math.max(0, Math.min(100, mergeRate));

  let interpretation = '';
  let recommendation = '';
  if (score >= 90) {
    interpretation = 'PRs almost always land - scoping and review are aligned';
    recommendation = 'Share playbooks with peers to keep the success rate elite';
  } else if (score >= 75) {
    interpretation = 'Strong merge rate with occasional misses';
    recommendation = 'Clarify acceptance criteria upfront to avoid rework';
  } else if (score >= 55) {
    interpretation = 'Merge success is uneven';
    recommendation = 'Tighten pre-work (design docs, checklists) before opening PRs';
  } else {
    interpretation = 'Many PRs stall or close without merging';
    recommendation = 'Diagnose failure drivers - scope churn, flaky tests, or review gaps';
  }

  return {
    score: Math.round(score),
    percentile: estimatePercentileFromScore(score),
    interpretation,
    recommendation,
  };
}

function estimatePercentileFromScore(score: number): number {
  if (score >= 90) return 95;
  if (score >= 75) return 80;
  if (score >= 60) return 65;
  if (score >= 40) return 45;
  if (score >= 20) return 25;
  return 10;
}

// Team summary utilities
export function computeTeamEfficiencySummary(
  developers: DeveloperEfficiency[]
): TeamEfficiencySummary | null {
  if (!developers.length) {
    return null;
  }

  const velocityScores = developers.map((dev) => dev.velocityScore);
  const qualityScores = developers.map((dev) => dev.qualityScore);
  const collaborationScores = developers.map((dev) => dev.collaborationScore);
  const consistencyScores = developers.map((dev) => dev.consistencyScore);

  return {
    velocity: aggregateScores("velocity", velocityScores),
    quality: aggregateScores("quality", qualityScores),
    collaboration: aggregateScores("collaboration", collaborationScores),
    consistency: aggregateScores("consistency", consistencyScores),
  };
}

function aggregateScores(
  metric: "velocity" | "quality" | "collaboration" | "consistency",
  scores: EfficiencyScore[]
): EfficiencyScore {
  const averageScore = scores.reduce((sum, score) => sum + score.score, 0) / scores.length;
  const averagePercentile = Math.round(
    scores.reduce((sum, score) => sum + score.percentile, 0) / scores.length
  );

  const { interpretation, recommendation } = interpretTeamScore(metric, averageScore);

  return {
    score: averageScore,
    percentile: averagePercentile,
    interpretation,
    recommendation,
  };
}

function interpretTeamScore(metric: string, score: number): {
  interpretation: string;
  recommendation: string;
} {
  let interpretation: string;
  let recommendation: string;

  if (score >= 80) {
    interpretation = `Team ${metric} is excellent—sets the bar for the org.`;
    recommendation = "Keep reinforcing the practices that make this sustainable.";
  } else if (score >= 60) {
    interpretation = `Team ${metric} is solid with room to optimise.`;
    recommendation = "Dig into the sub-metrics above to find the biggest win.";
  } else if (score >= 40) {
    interpretation = `Team ${metric} is trending in the wrong direction.`;
    recommendation = "Focus on the most lagging signal above to close gaps quickly.";
  } else {
    interpretation = `Team ${metric} is at risk—intervene quickly.`;
    recommendation = "Prioritise coaching and process changes before it impacts delivery further.";
  }

  return { interpretation, recommendation };
}

/**
 * Calculate overall developer efficiency
 */
export function calculateDeveloperEfficiency(
  metrics: DeveloperMetrics,
  benchmarks: RepositoryMetrics[]
): DeveloperEfficiency {
  const velocityScore = calculateVelocityScore(metrics, benchmarks);
  const qualityScore = calculateQualityScore(metrics, benchmarks);
  const collaborationScore = calculateCollaborationScore(metrics);
  const consistencyScore = calculateConsistencyScore(metrics);
  const throughputScore = calculateThroughputScore(metrics);
  const mergeSpeedScore = calculateMergeSpeedScore(metrics);
  const reviewResponsivenessScore = calculateReviewResponsivenessScore(metrics);
  const prSizeDisciplineScore = calculatePrSizeDisciplineScore(metrics);
  const mergeSuccessScore = calculateMergeSuccessScore(metrics);

  // Weighted overall score
  const overallScore =
    velocityScore.score * 0.2 +
    qualityScore.score * 0.2 +
    collaborationScore.score * 0.14 +
    consistencyScore.score * 0.1 +
    throughputScore.score * 0.14 +
    mergeSpeedScore.score * 0.08 +
    reviewResponsivenessScore.score * 0.07 +
    prSizeDisciplineScore.score * 0.04 +
    mergeSuccessScore.score * 0.03;

  return {
    author: metrics.author,
    repository_owner: metrics.repository_owner,
    repository_name: metrics.repository_name,
    velocityScore,
    qualityScore,
    collaborationScore,
    consistencyScore,
    throughputScore,
    mergeSpeedScore,
    reviewResponsivenessScore,
    prSizeDisciplineScore,
    mergeSuccessScore,
    overallScore: Math.round(overallScore),
  };
}

/**
 * Generate comparison insights for a repository vs benchmarks
 */
export function generateComparisonInsights(
  myRepo: RepositoryMetrics,
  benchmarks: RepositoryMetrics[]
): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];

  // Avg merge time
  const avgMergeHours = benchmarks.map(b => b.avg_merge_hours || 0).filter(x => x > 0);
  insights.push({
    metric: 'Average Time to Merge',
    yourValue: myRepo.avg_merge_hours || 0,
    industryMedian: median(avgMergeHours),
    industryTop10: percentileValue(avgMergeHours, 10),
    percentile: calculatePercentile(myRepo.avg_merge_hours || 0, avgMergeHours, true),
    interpretation: interpretMergeTime(myRepo.avg_merge_hours || 0, median(avgMergeHours)),
  });

  // Avg PR size
  const avgPRSizes = benchmarks.map(b => b.avg_pr_size || 0).filter(x => x > 0);
  insights.push({
    metric: 'Average PR Size',
    yourValue: myRepo.avg_pr_size || 0,
    industryMedian: median(avgPRSizes),
    industryTop10: percentileValue(avgPRSizes, 10),
    percentile: calculatePercentile(myRepo.avg_pr_size || 0, avgPRSizes, true),
    interpretation: interpretPRSize(myRepo.avg_pr_size || 0, median(avgPRSizes)),
  });

  // Merge rate
  const mergeRates = benchmarks.map(b => b.merge_rate_percent || 0);
  insights.push({
    metric: 'Merge Rate',
    yourValue: myRepo.merge_rate_percent || 0,
    industryMedian: median(mergeRates),
    industryTop10: percentileValue(mergeRates, 90),
    percentile: calculatePercentile(myRepo.merge_rate_percent || 0, mergeRates, false),
    interpretation: interpretMergeRate(myRepo.merge_rate_percent || 0, median(mergeRates)),
  });

  // Review engagement
  const reviewEngagement = benchmarks.map(b => b.avg_reviews_per_pr || 0);
  insights.push({
    metric: 'Reviews per PR',
    yourValue: myRepo.avg_reviews_per_pr || 0,
    industryMedian: median(reviewEngagement),
    industryTop10: percentileValue(reviewEngagement, 90),
    percentile: calculatePercentile(myRepo.avg_reviews_per_pr || 0, reviewEngagement, false),
    interpretation: interpretReviewEngagement(myRepo.avg_reviews_per_pr || 0, median(reviewEngagement)),
  });

  return insights;
}

/**
 * Calculate percentile rank
 * @param value The value to rank
 * @param dataset The dataset to rank against
 * @param lowerIsBetter Whether lower values are better (e.g., merge time)
 */
function calculatePercentile(value: number, dataset: number[], lowerIsBetter: boolean): number {
  if (dataset.length === 0) return 50;

  const sorted = [...dataset].sort((a, b) => a - b);
  const rank = sorted.filter(v => (lowerIsBetter ? v > value : v < value)).length;
  return Math.round((rank / sorted.length) * 100);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function percentileValue(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor((percentile / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)];
}

function interpretMergeTime(value: number, median: number): string {
  const ratio = value / median;
  if (ratio <= 0.7) return `Excellent! ${Math.round((1 - ratio) * 100)}% faster than industry median`;
  if (ratio <= 1) return 'Good - slightly faster than industry median';
  if (ratio <= 1.5) return `${Math.round((ratio - 1) * 100)}% slower than median - room for improvement`;
  return `${Math.round((ratio - 1) * 100)}% slower than median - significant opportunity to improve`;
}

function interpretPRSize(value: number, median: number): string {
  const ratio = value / median;
  if (ratio <= 0.7) return 'Excellent - smaller, focused PRs than typical';
  if (ratio <= 1) return 'Good - similar to industry median';
  if (ratio <= 1.5) return `PRs ${Math.round((ratio - 1) * 100)}% larger than median - consider breaking down`;
  return `PRs ${Math.round((ratio - 1) * 100)}% larger than median - strongly recommend smaller chunks`;
}

function interpretMergeRate(value: number, median: number): string {
  if (value >= 85) return 'Excellent merge rate - most PRs land successfully';
  if (value >= median) return 'Good merge rate - above industry median';
  if (value >= 70) return 'Moderate merge rate - some PRs may need better scoping';
  return 'Low merge rate - consider improving PR quality and scoping';
}

function interpretReviewEngagement(value: number, median: number): string {
  if (value >= median * 1.2) return 'Strong review culture - above industry standard';
  if (value >= median * 0.8) return 'Good review engagement - on par with industry';
  if (value >= 2) return 'Moderate engagement - could benefit from more active reviews';
  return 'Low engagement - establish stronger code review practices';
}

/**
 * Generate scatterplot data for visualizations
 */
export interface ScatterPoint {
  x: number;
  y: number;
  author?: string;
  prNumber?: number;
  title?: string;
}

export function generateSizeVsTimeScatter(prs: PullRequest[]): ScatterPoint[] {
  return prs
    .filter(pr => pr.is_merged && pr.time_to_merge_hours && pr.additions !== null && pr.deletions !== null)
    .map(pr => ({
      x: (pr.additions || 0) + (pr.deletions || 0), // PR size
      y: pr.time_to_merge_hours!, // Time to merge
      author: pr.author,
      prNumber: pr.pr_number,
      title: pr.title,
    }));
}

export function generateAdditionsVsDeletionsScatter(prs: PullRequest[]): ScatterPoint[] {
  return prs
    .filter(pr => pr.additions !== null && pr.deletions !== null)
    .map(pr => ({
      x: pr.additions!, // Additions
      y: pr.deletions!, // Deletions
      author: pr.author,
      prNumber: pr.pr_number,
      title: pr.title,
    }));
}

export function generateReviewTimeVsMergeTimeScatter(prs: PullRequest[]): ScatterPoint[] {
  return prs
    .filter(pr => pr.is_merged && pr.time_to_first_review_hours && pr.time_to_merge_hours)
    .map(pr => ({
      x: pr.time_to_first_review_hours!, // Time to first review
      y: pr.time_to_merge_hours!, // Time to merge
      author: pr.author,
      prNumber: pr.pr_number,
      title: pr.title,
    }));
}
