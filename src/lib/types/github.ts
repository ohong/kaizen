export interface GitHubPullRequestSummary {
  number: number;
}

export interface GitHubUserSummary {
  login?: string;
  avatar_url?: string | null;
}

export interface GitHubBranchSummary {
  ref?: string | null;
}

export interface GitHubPullRequestDetail extends GitHubPullRequestSummary {
  title: string;
  body: string | null;
  state: string;
  user: GitHubUserSummary | null;
  head: GitHubBranchSummary | null;
  base: GitHubBranchSummary | null;
  html_url: string;
  draft?: boolean;
  labels?: unknown[];
  requested_reviewers?: unknown[];
  requested_teams?: unknown[];
  assignees?: unknown[];
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  additions?: number | null;
  deletions?: number | null;
  changed_files?: number | null;
  commits?: number | null;
  comments?: number | null;
  review_comments?: number | null;
  mergeable_state?: string | null;
}
