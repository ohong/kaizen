import type { ActionGroup } from "@/lib/dashboard";
import { formatInteger, formatRelativeDate } from "@/lib/format";

interface ActionQueueSectionProps {
  actionGroups: ActionGroup[];
}

export function ActionQueueSection({ actionGroups }: ActionQueueSectionProps) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-[var(--hud-text-bright)]">Action queue</h2>
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

function PRListItem({ pr }: { pr: ActionGroup["prs"][number] }) {
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
