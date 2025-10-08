"use client";

import { useState } from "react";
import type { ActionGroup } from "@/lib/dashboard";
import { formatInteger, formatRelativeDate } from "@/lib/format";

interface ActionQueueSectionProps {
  actionGroups: ActionGroup[];
}

export function ActionQueueSection({ actionGroups }: ActionQueueSectionProps) {
  const hasBlockers = actionGroups.length > 0;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <div className={`h-2 w-2 rounded-full ${hasBlockers ? "bg-[var(--hud-warning)] animate-pulse" : "bg-[var(--hud-success)]"}`} />
        <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Action Queue</h2>
        {hasBlockers && (
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-warning)] bg-[var(--hud-warning)]/10 px-2 py-1 rounded">
            {actionGroups.reduce((sum, g) => sum + g.prs.length, 0)} items need attention
          </span>
        )}
      </div>
      {actionGroups.length === 0 ? (
        <div className="hud-panel-elevated hud-corner p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--hud-success)]/10 mb-3">
            <div className="w-6 h-6 rounded-full bg-[var(--hud-success)]"></div>
          </div>
          <p className="text-sm text-[var(--hud-text)]">No blocking pull requests right now.</p>
          <p className="text-xs text-[var(--hud-text-dim)] mt-1">Keep the flow moving.</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:pb-0">
          {actionGroups.map((group) => (
            <ActionGroupCard key={group.key} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActionGroupCard({ group }: { group: ActionGroup }) {
  const [showAll, setShowAll] = useState(false);

  const oldestUpdate = group.prs.reduce<string | null>((oldest, pr) => {
    if (!pr.updated_at) return oldest;
    if (!oldest) return pr.updated_at;
    return new Date(pr.updated_at) < new Date(oldest) ? pr.updated_at : oldest;
  }, null);

  const displayedPRs = showAll ? group.prs : group.prs.slice(0, 3);
  const remainingCount = group.prs.length - 3;

  const isUrgent = group.key.includes("stale") || group.key.includes("conflict");

  return (
    <div
      className={`hud-panel-elevated hud-corner w-full min-w-[280px] max-w-[360px] p-4 transition-transform duration-200 hover:-translate-y-1 lg:min-w-0 lg:max-w-none ${
        isUrgent ? "border-[var(--hud-danger)]/40" : "border-[var(--hud-warning)]/30"
      }`}
    >
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-colors group-open:bg-[var(--hud-bg-raised)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`h-1.5 w-1.5 rounded-full ${isUrgent ? "bg-[var(--hud-danger)]" : "bg-[var(--hud-warning)]"}`} />
              <p className={`font-mono text-xs uppercase tracking-wider font-semibold ${isUrgent ? "text-[var(--hud-danger)]" : "text-[var(--hud-warning)]"}`}>
                {group.title}
              </p>
            </div>
            <p className="text-sm text-[var(--hud-text)]">
              {group.description}
            </p>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
              <span className="font-semibold text-[var(--hud-text)]">{group.prs.length} PR{group.prs.length === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>oldest {oldestUpdate ? formatRelativeDate(oldestUpdate) : "n/a"}</span>
            </div>
          </div>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-150 group-open:rotate-90 group-open:bg-[var(--hud-bg-highest)] ${
              isUrgent
                ? "border-[var(--hud-danger)] text-[var(--hud-danger)]"
                : "border-[var(--hud-warning)] text-[var(--hud-warning)]"
            }`}
            aria-hidden
          >
            ▸
          </span>
        </summary>
        <div className="mt-4">
          <div className={`space-y-3 ${showAll ? "max-h-[600px] overflow-y-auto pr-1" : ""}`}>
            {displayedPRs.map((pr) => (
              <PRListItem key={pr.id ?? pr.pr_number} pr={pr} urgent={isUrgent} />
            ))}
          </div>

          {remainingCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-raised)] px-3 py-2 text-center font-mono text-[10px] uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:border-[var(--hud-accent)] hover:bg-[var(--hud-accent)]/10 hover:shadow-[var(--shadow-medium)]"
            >
              {showAll ? "Show less" : `Show ${remainingCount} more PR${remainingCount === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </details>
    </div>
  );
}

function PRListItem({ pr, urgent }: { pr: ActionGroup["prs"][number]; urgent: boolean }) {
  const size = (pr.additions ?? 0) + (pr.deletions ?? 0);
  return (
    <a
      href={pr.html_url}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-lg border bg-[var(--hud-bg)] px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-medium)] ${
        urgent
          ? "border-[var(--hud-danger)]/30 hover:border-[var(--hud-danger)]/60 hover:bg-[var(--hud-danger)]/5"
          : "border-[var(--hud-border)] hover:border-[var(--hud-accent)]/40 hover:bg-[var(--hud-bg-elevated)]"
      }`}
    >
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
        <span className={urgent ? "text-[var(--hud-danger)]" : "text-[var(--hud-text-dim)]"}>PR #{pr.pr_number}</span>
        <span className="text-[var(--hud-text-dim)]">{formatRelativeDate(pr.updated_at)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-medium text-[var(--hud-text-bright)]">
        {pr.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--hud-text-dim)]">
        <span className="font-medium text-[var(--hud-text)]">{pr.author || "unknown"}</span>
        <span>•</span>
        <span>{formatInteger(pr.changed_files)} files</span>
        <span>•</span>
        <span>{formatInteger(size)} lines</span>
      </div>
    </a>
  );
}
