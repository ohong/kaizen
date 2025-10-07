import { supabase } from "@/lib/supabase";

export interface RepositoryIdentifier {
  owner: string;
  name: string;
}

export interface RepositoryMetadata extends RepositoryIdentifier {
  description?: string | null;
  companySize?: string | null;
  industry?: string | null;
  isBenchmark?: boolean;
}

export interface RepositorySyncOptions extends RepositoryIdentifier {
  perRepo?: number;
  state?: "open" | "closed" | "all";
  token?: string;
  metadata?: RepositoryMetadata;
  page?: number;
}

export interface RepositorySyncResult {
  owner: string;
  name: string;
  total: number;
  newCount: number;
  updatedCount: number;
  errorCount: number;
}

interface GitHubPullSummary {
  number: number;
}

interface GitHubUser {
  login?: string | null;
  avatar_url?: string | null;
}

interface GitHubPullHeadBase {
  ref?: string | null;
}

interface GitHubPullDetail extends GitHubPullSummary {
  title: string;
  body: string | null;
  state: "open" | "closed" | string;
  user?: GitHubUser | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  html_url: string;
  draft: boolean;
  labels?: unknown[];
  requested_reviewers?: unknown[];
  requested_teams?: unknown[];
  head?: GitHubPullHeadBase | null;
  base?: GitHubPullHeadBase | null;
  additions?: number | null;
  deletions?: number | null;
  changed_files?: number | null;
  commits?: number | null;
  comments?: number | null;
  review_comments?: number | null;
  mergeable_state?: string | null;
  assignees?: unknown[];
}

const DEFAULT_SYNC_COUNT = 100;
const DEFAULT_STATE: "open" | "closed" | "all" = "all";

export function getGitHubToken(customToken?: string): string {
  const token = customToken || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GitHub token not configured. Set GITHUB_TOKEN in your environment.");
  }
  return token;
}

export async function upsertRepositoryMetadata(metadata: RepositoryMetadata) {
  const now = new Date().toISOString();
  await supabase
    .from("repositories")
    .upsert(
      {
        owner: metadata.owner,
        name: metadata.name,
        full_name: `${metadata.owner}/${metadata.name}`,
        description: metadata.description ?? null,
        company_size: metadata.companySize ?? null,
        industry: metadata.industry ?? null,
        is_benchmark: metadata.isBenchmark ?? false,
        updated_at: now,
      } as never,
      {
        onConflict: "owner,name",
      }
    );
}

export async function syncRepository(opts: RepositorySyncOptions): Promise<RepositorySyncResult> {
  const token = getGitHubToken(opts.token);
  if (opts.metadata) {
    await upsertRepositoryMetadata(opts.metadata);
  }

  const prs = await fetchPRsForRepo(
    opts.owner,
    opts.name,
    opts.perRepo ?? DEFAULT_SYNC_COUNT,
    token,
    opts.state,
    opts.page
  );

  let newCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const pr of prs) {
    try {
      const prData = await transformPRData(pr, opts.owner, opts.name, token);

      const { data: existing } = await supabase
        .from("pull_requests")
        .select("id")
        .eq("repository_owner", opts.owner)
        .eq("repository_name", opts.name)
        .eq("pr_number", pr.number)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("pull_requests")
          .update(prData as never)
          .eq("repository_owner", opts.owner)
          .eq("repository_name", opts.name)
          .eq("pr_number", pr.number);

        if (error) {
          console.error(`Error updating PR #${pr.number}:`, error);
          errorCount++;
        } else {
          updatedCount++;
        }
      } else {
        const { error } = await supabase.from("pull_requests").insert(prData as never);

        if (error) {
          console.error(`Error inserting PR #${pr.number}:`, error);
          errorCount++;
        } else {
          newCount++;
        }
      }
    } catch (prError) {
      console.error(`Error processing PR #${pr.number}:`, prError);
      errorCount++;
    }
  }

  return {
    owner: opts.owner,
    name: opts.name,
    total: prs.length,
    newCount,
    updatedCount,
    errorCount,
  };
}

export async function fetchPRsForRepo(
  owner: string,
  name: string,
  count: number,
  token: string,
  state: "open" | "closed" | "all" = DEFAULT_STATE,
  startPage: number = 1
): Promise<GitHubPullSummary[]> {
  const allPRs: GitHubPullSummary[] = [];
  let page = Math.max(1, startPage);
  const perPage = Math.min(100, count);

  while (allPRs.length < count) {
    const url = new URL(`https://api.github.com/repos/${owner}/${name}/pulls`);
    url.searchParams.set("state", state);
    url.searchParams.set("per_page", perPage.toString());
    url.searchParams.set("page", page.toString());
    url.searchParams.set("sort", "updated");
    url.searchParams.set("direction", "desc");

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const prs = (await response.json()) as unknown;
    if (!Array.isArray(prs) || prs.length === 0) break;

    const validPRs = prs.filter((item): item is GitHubPullSummary =>
      item !== null && typeof item === "object" && typeof (item as { number?: unknown }).number === "number"
    );

    allPRs.push(...validPRs);
    if (validPRs.length < perPage || allPRs.length >= count) break;

    page++;
  }

  return allPRs.slice(0, count);
}

export async function transformPRData(pr: GitHubPullSummary, owner: string, name: string, token: string) {
  const detailUrl = `https://api.github.com/repos/${owner}/${name}/pulls/${pr.number}`;
  const detailResponse = await fetch(detailUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!detailResponse.ok) {
    throw new Error(`Failed to fetch PR details: ${detailResponse.status}`);
  }

  const prDetail = (await detailResponse.json()) as GitHubPullDetail;

  const createdAt = new Date(prDetail.created_at);
  const mergedAt = prDetail.merged_at ? new Date(prDetail.merged_at) : null;
  const closedAt = prDetail.closed_at ? new Date(prDetail.closed_at) : null;

  const timeToMergeHours = mergedAt ? (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : null;
  const timeToCloseHours = closedAt ? (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : null;

  return {
    pr_number: prDetail.number,
    title: prDetail.title,
    body: prDetail.body || null,
    state: prDetail.state,
    author: prDetail.user?.login || "unknown",
    author_avatar_url: prDetail.user?.avatar_url || null,
    created_at: prDetail.created_at,
    updated_at: prDetail.updated_at,
    merged_at: prDetail.merged_at || null,
    closed_at: prDetail.closed_at || null,
    html_url: prDetail.html_url,
    draft: prDetail.draft || false,
    labels: prDetail.labels || [],
    requested_reviewers: prDetail.requested_reviewers || [],
    requested_teams: prDetail.requested_teams || [],
    head_ref: prDetail.head?.ref || "unknown",
    base_ref: prDetail.base?.ref || "unknown",
    repository_owner: owner,
    repository_name: name,
    additions: prDetail.additions ?? null,
    deletions: prDetail.deletions ?? null,
    changed_files: prDetail.changed_files ?? null,
    commits_count: prDetail.commits ?? null,
    comments_count: prDetail.comments ?? 0,
    review_comments_count: prDetail.review_comments ?? 0,
    reviews_count: 0,
    is_merged: prDetail.merged_at !== null,
    mergeable_state: prDetail.mergeable_state || null,
    assignees: prDetail.assignees || [],
    time_to_first_review_hours: null,
    time_to_merge_hours: timeToMergeHours,
    time_to_close_hours: timeToCloseHours,
    synced_at: new Date().toISOString(),
  };
}
