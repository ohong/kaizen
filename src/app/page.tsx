"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type PullRequest = {
  id: string;
  pr_number: number;
  title: string;
  body: string | null;
  state: "open" | "closed";
  author: string;
  author_avatar_url: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  html_url: string;
  draft: boolean;
  labels: unknown[];
  requested_reviewers: unknown[];
  requested_teams: unknown[];
  head_ref: string;
  base_ref: string;
  additions: number | null;
  deletions: number | null;
  changed_files: number | null;
  commits_count: number | null;
  comments_count: number;
  review_comments_count: number;
  reviews_count: number;
  is_merged: boolean;
  mergeable_state: string | null;
  assignees: unknown[];
  time_to_first_review_hours: number | null;
  time_to_merge_hours: number | null;
  time_to_close_hours: number | null;
  synced_at: string;
};

type SummaryMetrics = {
  totalPrs: number;
  openPrs: number;
  closedPrs: number;
  mergedPrs: number;
  topMerger?: { author: string; count: number };
  topChangeAuthor?: { author: string; changes: number };
  averageMergeHours: number | null;
};

type ContributorSummary = {
  author: string;
  totalPrs: number;
  mergedPrs: number;
  openPrs: number;
  closedPrs: number;
  totalAdditions: number;
  totalDeletions: number;
  totalChanges: number;
  averageMergeHours: number | null;
  lastActivity: string | null;
  recentPrTitle: string | null;
  recentPrNumber: number | null;
};

type ViewMode = "prs" | "contributors";

const numberFormatter = new Intl.NumberFormat("en-US");

export default function DashboardPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [selectedPrNumber, setSelectedPrNumber] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("prs");
  const [selectedContributor, setSelectedContributor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from<PullRequest>("pull_requests")
        .select("*")
        .order("updated_at", { ascending: false });

      if (queryError) {
        setError(queryError.message);
        setPrs([]);
        return;
      }

      setPrs(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pull requests");
      setPrs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrs();
  }, [loadPrs]);

  useEffect(() => {
    if (!selectedPrNumber && prs.length > 0) {
      setSelectedPrNumber(prs[0].pr_number);
    }
  }, [prs, selectedPrNumber]);

  const selectedPr = useMemo(() => {
    if (prs.length === 0) {
      return null;
    }

    return prs.find((pr) => pr.pr_number === selectedPrNumber) ?? prs[0];
  }, [prs, selectedPrNumber]);

  const metrics = useMemo(() => computeSummary(prs), [prs]);

  const latestSync = useMemo(() => {
    if (prs.length === 0) {
      return null;
    }

    return prs.reduce<string | null>((acc, pr) => {
      if (!pr.synced_at) {
        return acc;
      }
      if (!acc) {
        return pr.synced_at;
      }
      return new Date(pr.synced_at) > new Date(acc) ? pr.synced_at : acc;
    }, null);
  }, [prs]);

  const contributorSummaries = useMemo(() => computeContributors(prs), [prs]);

  useEffect(() => {
    if (viewMode !== "contributors") {
      return;
    }

    if (contributorSummaries.length === 0) {
      if (selectedContributor !== null) {
        setSelectedContributor(null);
      }
      return;
    }

    if (
      !selectedContributor ||
      !contributorSummaries.some((entry) => entry.author === selectedContributor)
    ) {
      const fallback = contributorSummaries[0]?.author ?? null;
      if (fallback && fallback !== selectedContributor) {
        setSelectedContributor(fallback);
      }
    }
  }, [viewMode, contributorSummaries, selectedContributor]);

  const selectedContributorSummary = useMemo(() => {
    if (contributorSummaries.length === 0) {
      return null;
    }
    if (!selectedContributor) {
      return contributorSummaries[0];
    }
    return (
      contributorSummaries.find((entry) => entry.author === selectedContributor) ??
      contributorSummaries[0]
    );
  }, [contributorSummaries, selectedContributor]);

  const contributorPrs = useMemo(() => {
    if (!selectedContributorSummary) {
      return [];
    }

    return prs
      .filter((pr) => pr.author === selectedContributorSummary.author)
      .sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }, [prs, selectedContributorSummary]);

  const isContributorView = viewMode === "contributors";
  const hasPrs = prs.length > 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">Pull Request Intelligence</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Insights gathered from the GitHub sync. Toggle between pull requests and contributors to
              trace the work and the people driving the project forward.
            </p>
            <p className="mt-4 text-xs uppercase tracking-widest text-slate-500">
              Last synced: {latestSync ? formatDate(latestSync) : "—"}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <button
              type="button"
              onClick={loadPrs}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh data"}
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryTile label="Total PRs" value={metrics.totalPrs.toString()} />
          <SummaryTile
            label="Open PRs"
            value={metrics.openPrs.toString()}
            accent="text-emerald-300"
          />
          <SummaryTile
            label="Merged PRs"
            value={metrics.mergedPrs.toString()}
            sublabel={metrics.topMerger ? `Top: ${metrics.topMerger.author} (${metrics.topMerger.count})` : undefined}
            accent="text-purple-300"
          />
          <SummaryTile
            label="Largest Churn"
            value={metrics.topChangeAuthor ? metrics.topChangeAuthor.author : "—"}
            sublabel={metrics.topChangeAuthor ? `${formatNumber(metrics.topChangeAuthor.changes)} lines` : undefined}
            accent="text-amber-300"
          />
          <SummaryTile
            label="Avg Time to Merge"
            value={formatHours(metrics.averageMergeHours)}
            sublabel="Across merged PRs"
            className="sm:col-span-2 lg:col-span-1"
          />
          <SummaryTile
            label="Closed (incl. merged)"
            value={metrics.closedPrs.toString()}
            sublabel="Merged + closed without merge"
            className="sm:col-span-2 lg:col-span-1"
          />
        </section>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && !hasPrs ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            Loading pull requests…
          </div>
        ) : !hasPrs ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-400">
            No pull requests synced yet. Trigger the sync to populate this dashboard.
          </div>
        ) : isContributorView ? (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="flex max-h-[70vh] flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Contributors</span>
                <span>{contributorSummaries.length}</span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto">
                {contributorSummaries.map((contributor) => {
                  const isSelected =
                    selectedContributorSummary?.author === contributor.author;
                  return (
                    <button
                      key={contributor.author || "unknown"}
                      type="button"
                      onClick={() => setSelectedContributor(contributor.author)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-slate-500 bg-slate-800"
                          : "border-transparent bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        <span>{contributor.author || "unknown"}</span>
                        <span>{formatNumber(contributor.totalPrs)} PRs</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-100">
                        {contributor.recentPrTitle ?? "No recent activity"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>
                          {formatNumber(contributor.mergedPrs)} merged · {formatNumber(contributor.openPrs)} open
                        </span>
                        <span>
                          {contributor.lastActivity
                            ? formatRelativeDate(contributor.lastActivity)
                            : "—"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              {selectedContributorSummary ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Contributor</p>
                    <h2 className="mt-1 text-2xl font-semibold text-white">
                      {selectedContributorSummary.author || "unknown"}
                    </h2>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                      <span>
                        {selectedContributorSummary.totalPrs === 1
                          ? "1 pull request"
                          : `${formatNumber(selectedContributorSummary.totalPrs)} pull requests`}
                      </span>
                      <span>·</span>
                      <span>
                        Last activity {selectedContributorSummary.lastActivity
                          ? formatRelativeDate(selectedContributorSummary.lastActivity)
                          : "—"}
                      </span>
                      {selectedContributorSummary.recentPrNumber ? (
                        <>
                          <span>·</span>
                          <span>
                            Recent PR #{selectedContributorSummary.recentPrNumber}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailStat
                      label="Total PRs"
                      value={formatNumber(selectedContributorSummary.totalPrs)}
                    />
                    <DetailStat
                      label="Merged PRs"
                      value={formatNumber(selectedContributorSummary.mergedPrs)}
                    />
                    <DetailStat
                      label="Open PRs"
                      value={formatNumber(selectedContributorSummary.openPrs)}
                    />
                    <DetailStat
                      label="Total changes"
                      value={formatLines(selectedContributorSummary.totalChanges)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailStat
                      label="Total additions"
                      value={formatLines(selectedContributorSummary.totalAdditions)}
                    />
                    <DetailStat
                      label="Total deletions"
                      value={formatLines(selectedContributorSummary.totalDeletions)}
                    />
                    <DetailStat
                      label="Avg merge time"
                      value={formatHours(selectedContributorSummary.averageMergeHours)}
                    />
                  </div>

                  <div>
                    <h3 className="text-xs uppercase tracking-wide text-slate-500">Pull requests</h3>
                    <div className="mt-3 flex flex-col gap-3">
                      {contributorPrs.map((pr) => (
                        <a
                          key={pr.id ?? pr.pr_number}
                          href={pr.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-xl border border-transparent bg-slate-950/40 px-4 py-3 transition-colors hover:border-slate-700 hover:bg-slate-900"
                        >
                          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
                            <span>PR #{pr.pr_number}</span>
                            <StateBadge state={pr.state} merged={pr.is_merged} />
                          </div>
                          <p className="mt-2 text-sm font-medium text-slate-100">{pr.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span>Updated {formatRelativeDate(pr.updated_at)}</span>
                            <span>{formatNumber(pr.changed_files)} files</span>
                            <span>{formatLines((pr.additions ?? 0) + (pr.deletions ?? 0))}</span>
                          </div>
                        </a>
                      ))}
                      {contributorPrs.length === 0 && (
                        <p className="text-sm text-slate-400">No pull requests recorded for this contributor.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select a contributor to see their details.</p>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <aside className="flex max-h-[70vh] flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-500">
                <span>Pull Requests</span>
                <span>{prs.length}</span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto">
                {prs.map((pr) => {
                  const isSelected = (selectedPr?.pr_number ?? null) === pr.pr_number;
                  return (
                    <button
                      key={pr.id ?? pr.pr_number}
                      type="button"
                      onClick={() => setSelectedPrNumber(pr.pr_number)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? "border-slate-500 bg-slate-800"
                          : "border-transparent bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        <span>PR #{pr.pr_number}</span>
                        <StateBadge state={pr.state} merged={pr.is_merged} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-100">{pr.title}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>{pr.author}</span>
                        <span>{formatRelativeDate(pr.updated_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              {selectedPr ? (
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">PR #{selectedPr.pr_number}</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">{selectedPr.title}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                        <span>by {selectedPr.author}</span>
                        <span>·</span>
                        <span>Created {formatRelativeDate(selectedPr.created_at)}</span>
                        <span>·</span>
                        <span>Last updated {formatRelativeDate(selectedPr.updated_at)}</span>
                      </div>
                    </div>
                    <a
                      href={selectedPr.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
                    >
                      View on GitHub
                    </a>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailStat label="State" value={selectedPr.is_merged ? "Merged" : capitalise(selectedPr.state)} />
                    <DetailStat label="Head" value={selectedPr.head_ref} />
                    <DetailStat label="Base" value={selectedPr.base_ref} />
                    <DetailStat label="Mergeable" value={selectedPr.mergeable_state ?? "Unknown"} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailStat label="Additions" value={formatNumber(selectedPr.additions)} />
                    <DetailStat label="Deletions" value={formatNumber(selectedPr.deletions)} />
                    <DetailStat label="Changed files" value={formatNumber(selectedPr.changed_files)} />
                    <DetailStat label="Commits" value={formatNumber(selectedPr.commits_count)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailStat label="Comments" value={formatNumber(selectedPr.comments_count)} />
                    <DetailStat label="Review comments" value={formatNumber(selectedPr.review_comments_count)} />
                    <DetailStat label="Reviews" value={formatNumber(selectedPr.reviews_count)} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <DetailStat label="Time to merge" value={formatHours(selectedPr.time_to_merge_hours)} />
                    <DetailStat label="Time to close" value={formatHours(selectedPr.time_to_close_hours)} />
                    <DetailStat label="First review" value={formatHours(selectedPr.time_to_first_review_hours)} />
                  </div>

                  {selectedPr.labels?.length ? (
                    <div>
                      <h3 className="text-xs uppercase tracking-wide text-slate-500">Labels</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {selectedPr.labels.map((label, index) => {
                          const name = extractLabelName(label);
                          if (!name) {
                            return null;
                          }
                          return (
                            <span
                              key={`${name}-${index}`}
                              className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                            >
                              {name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {selectedPr.body ? (
                    <div>
                      <h3 className="text-xs uppercase tracking-wide text-slate-500">Description</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300 line-clamp-[12]">
                        {selectedPr.body}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-400">Select a pull request to see the details.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryTile(props: {
  label: string;
  value: string;
  sublabel?: string;
  accent?: string;
  className?: string;
}) {
  const { label, value, sublabel, accent, className } = props;
  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/60 p-5 ${className ?? ""}`.trim()}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${accent ?? "text-white"}`}>{value}</p>
      {sublabel ? <p className="mt-1 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  );
}

function DetailStat(props: { label: string; value: string }) {
  const { label, value } = props;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-medium text-slate-100">{value}</p>
    </div>
  );
}

function ViewModeToggle({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  const options: ViewMode[] = ["prs", "contributors"];
  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 p-1">
      {options.map((mode) => {
        const isActive = value === mode;
        const label = mode === "prs" ? "Pull Requests" : "Contributors";
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? "bg-slate-800 text-white"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function StateBadge({ state, merged }: { state: PullRequest["state"]; merged: boolean }) {
  if (merged) {
    return <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">Merged</span>;
  }

  if (state === "open") {
    return <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Open</span>;
  }

  return <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">Closed</span>;
}

function computeSummary(prs: PullRequest[]): SummaryMetrics {
  if (prs.length === 0) {
    return {
      totalPrs: 0,
      openPrs: 0,
      closedPrs: 0,
      mergedPrs: 0,
      averageMergeHours: null,
    };
  }

  const mergesByAuthor = new Map<string, number>();
  const changesByAuthor = new Map<string, number>();
  const mergeDurations: number[] = [];
  let openPrs = 0;
  let mergedPrs = 0;

  for (const pr of prs) {
    if (pr.state === "open") {
      openPrs += 1;
    }

    if (pr.is_merged) {
      mergedPrs += 1;
      if (pr.author) {
        mergesByAuthor.set(pr.author, (mergesByAuthor.get(pr.author) ?? 0) + 1);
      }
      if (typeof pr.time_to_merge_hours === "number") {
        mergeDurations.push(pr.time_to_merge_hours);
      }
    }

    const author = pr.author || "unknown";
    const churn = (pr.additions ?? 0) + (pr.deletions ?? 0);
    changesByAuthor.set(author, (changesByAuthor.get(author) ?? 0) + churn);
  }

  const topMergerEntry = Array.from(mergesByAuthor.entries()).sort((a, b) => b[1] - a[1])[0];
  const topChangeEntry = Array.from(changesByAuthor.entries()).sort((a, b) => b[1] - a[1])[0];

  const averageMergeHours = mergeDurations.length
    ? mergeDurations.reduce((sum, value) => sum + value, 0) / mergeDurations.length
    : null;

  return {
    totalPrs: prs.length,
    openPrs,
    closedPrs: prs.length - openPrs,
    mergedPrs,
    topMerger: topMergerEntry
      ? { author: topMergerEntry[0], count: topMergerEntry[1] }
      : undefined,
    topChangeAuthor: topChangeEntry
      ? { author: topChangeEntry[0], changes: topChangeEntry[1] }
      : undefined,
    averageMergeHours,
  };
}

function computeContributors(prs: PullRequest[]): ContributorSummary[] {
  const summaries = new Map<string, ContributorSummary & { mergeDurations: number[] }>();

  for (const pr of prs) {
    const author = pr.author || "unknown";
    let entry = summaries.get(author);

    if (!entry) {
      entry = {
        author,
        totalPrs: 0,
        mergedPrs: 0,
        openPrs: 0,
        closedPrs: 0,
        totalAdditions: 0,
        totalDeletions: 0,
        totalChanges: 0,
        averageMergeHours: null,
        lastActivity: null,
        recentPrTitle: null,
        recentPrNumber: null,
        mergeDurations: [],
      };
      summaries.set(author, entry);
    }

    entry.totalPrs += 1;
    if (pr.state === "open") {
      entry.openPrs += 1;
    } else {
      entry.closedPrs += 1;
    }
    if (pr.is_merged) {
      entry.mergedPrs += 1;
      if (typeof pr.time_to_merge_hours === "number") {
        entry.mergeDurations.push(pr.time_to_merge_hours);
      }
    }

    const additions = pr.additions ?? 0;
    const deletions = pr.deletions ?? 0;
    entry.totalAdditions += additions;
    entry.totalDeletions += deletions;
    entry.totalChanges += additions + deletions;

    if (!entry.lastActivity || new Date(pr.updated_at) > new Date(entry.lastActivity)) {
      entry.lastActivity = pr.updated_at;
      entry.recentPrTitle = pr.title;
      entry.recentPrNumber = pr.pr_number;
    }
  }

  return Array.from(summaries.values())
    .map((entry) => {
      const averageMergeHours = entry.mergeDurations.length
        ? entry.mergeDurations.reduce((sum, value) => sum + value, 0) / entry.mergeDurations.length
        : null;

      return {
        author: entry.author,
        totalPrs: entry.totalPrs,
        mergedPrs: entry.mergedPrs,
        openPrs: entry.openPrs,
        closedPrs: entry.closedPrs,
        totalAdditions: entry.totalAdditions,
        totalDeletions: entry.totalDeletions,
        totalChanges: entry.totalChanges,
        averageMergeHours,
        lastActivity: entry.lastActivity,
        recentPrTitle: entry.recentPrTitle,
        recentPrNumber: entry.recentPrNumber,
      };
    })
    .sort((a, b) => {
      if (b.totalPrs !== a.totalPrs) {
        return b.totalPrs - a.totalPrs;
      }
      return b.totalChanges - a.totalChanges;
    });
}

function formatHours(hours: number | null): string {
  if (typeof hours !== "number" || Number.isNaN(hours)) {
    return "—";
  }

  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const remainderAfterDays = totalMinutes - days * 60 * 24;
  const hrs = Math.floor(remainderAfterDays / 60);
  const minutes = remainderAfterDays - hrs * 60;

  const parts: string[] = [];
  if (days) {
    parts.push(`${days}d`);
  }
  if (hrs) {
    parts.push(`${hrs}h`);
  }
  if (!days && minutes && parts.length < 2) {
    parts.push(`${minutes}m`);
  }

  if (parts.length === 0) {
    return `${minutes}m`;
  }

  return parts.join(" ");
}

function formatDate(iso: string): string {
  if (!iso) {
    return "—";
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
}

function formatRelativeDate(iso: string): string {
  if (!iso) {
    return "—";
  }

  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  const now = new Date();
  const diffMs = now.getTime() - parsed.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays}d ago`;
  }
  return parsed.toLocaleDateString();
}

function formatNumber(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  return numberFormatter.format(value);
}

function formatLines(value: number | null | undefined): string {
  const formatted = formatNumber(value);
  if (formatted === "—") {
    return formatted;
  }
  return `${formatted} lines`;
}

function extractLabelName(label: unknown): string | null {
  if (!label || typeof label !== "object") {
    return null;
  }
  if ("name" in label && typeof (label as { name?: unknown }).name === "string") {
    return (label as { name?: string }).name ?? null;
  }
  return null;
}

function capitalise(value: string): string {
  if (!value.length) {
    return value;
  }
  return value[0].toUpperCase() + value.slice(1);
}
