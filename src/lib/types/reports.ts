export interface ReportRepositoryDetails {
  owner: string;
  name: string;
}

export interface ReportDeveloperScore {
  author: string;
  overallScore: number;
}

export interface ReportHealthSummary {
  healthScore?: number | string;
  summary?: string;
  openPrCount?: number;
  stalePrCount?: number;
  throughputPerWeek?: number | null;
  mergeRate?: number | null;
  avgMergeHours?: number | null;
  avgTimeToFirstReview?: number | null;
}

export interface ReportBenchmarksGroup {
  name: string;
  yourTeam: number;
  industryMedian: number;
  topPerformer?: number;
}

export interface ReportDistributionEntry {
  category: string;
  value: number;
  color: string;
}

export interface ReportErrorsSummary {
  total: number;
  topMessages: Array<{ message: string; count: number }>;
}

export interface ReportPayload {
  repository?: ReportRepositoryDetails | null;
  latestSync?: string | null;
  health?: ReportHealthSummary | null;
  actionQueue?: Array<{ key: string; title: string; count: number }>;
  developers?: {
    top?: ReportDeveloperScore[];
    needsAttention?: ReportDeveloperScore[];
  } | null;
  benchmarks?: {
    speed?: ReportBenchmarksGroup[];
    quality?: ReportBenchmarksGroup[];
  } | null;
  distributions?: {
    prSizeDistribution?: ReportDistributionEntry[];
  } | null;
  chartsSummary?: {
    sizeVsTimePoints?: number;
    reviewVsMergePoints?: number;
  } | null;
  errors?: ReportErrorsSummary | null;
}

export interface SendReportRequestBody {
  recipients?: string[];
  payload?: ReportPayload;
}
