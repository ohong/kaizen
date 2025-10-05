import type { ActionGroup, HealthSummary } from "@/lib/dashboard";
import { formatHours, formatInteger, formatPercent, formatRelativeDate } from "@/lib/format";

interface HealthOverviewSectionProps {
  summary: HealthSummary;
  actionGroups: ActionGroup[];
}

export function HealthOverviewSection({ summary, actionGroups }: HealthOverviewSectionProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <div className="hud-panel hud-corner p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Team delivery health
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">{summary.summary}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Composite score
            </p>
            <p className="text-4xl font-semibold text-[var(--hud-accent)]">
              {summary.healthScore !== null ? summary.healthScore : "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryStat
            label="Throughput / week"
            value={
              summary.throughputPerWeek !== null ? summary.throughputPerWeek.toFixed(1) : "—"
            }
            suffix=" PRs"
          />
          <SummaryStat
            label="Merge rate"
            value={formatPercent(summary.mergeRate)}
          />
          <SummaryStat label="Merge time" value={formatHours(summary.avgMergeHours)} />
          <SummaryStat label="First review" value={formatHours(summary.avgTimeToFirstReview)} />
          <SummaryStat
            label="Reviews / PR"
            value={
              summary.avgReviewsPerPR !== null ? summary.avgReviewsPerPR.toFixed(1) : "—"
            }
          />
          <SummaryStat
            label="Active contributors"
            value={formatInteger(summary.activeContributors)}
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryStat label="Small PRs" value={formatPercent(summary.smallPRShare)} />
          <SummaryStat label="Large PRs" value={formatPercent(summary.largePRShare)} />
          <SummaryStat
            label="Open PRs"
            value={formatInteger(summary.openPrCount)}
          />
          <SummaryStat
            label="Stale PRs"
            value={formatInteger(summary.stalePrCount)}
          />
          {summary.backlogBuckets.map((bucket) => (
            <BacklogPill
              key={bucket.label}
              label={bucket.label}
              count={bucket.count}
              total={summary.openPrCount}
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <FocusList
            title="Wins"
            tone="positive"
            items={summary.wins}
            emptyLabel="No standout wins yet — sync data to refresh."
          />
          <FocusList
            title="Focus next"
            tone="warning"
            items={summary.focusAreas}
            emptyLabel="Nothing urgent — keep an eye on review flow."
          />
        </div>
      </div>

      <div className="grid gap-6">
        <div className="hud-panel hud-corner p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                Priority action queue
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--hud-text-bright)]">
                Rally around the stuck work
              </h3>
            </div>
            <span className="rounded-full border border-[var(--hud-border)] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[var(--hud-text-dim)]">
              {formatInteger(actionGroups.reduce((total, group) => total + group.prs.length, 0))} PRs
            </span>
          </div>
          <div className="mt-6 space-y-4">
            {actionGroups.length === 0 ? (
              <p className="text-sm text-[var(--hud-text-dim)]">
                Nothing critical right now — keep momentum on the current plan.
              </p>
            ) : (
              actionGroups.map((group) => <ActionGroupCard key={group.key} group={group} />)
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface SummaryStatProps {
  label: string;
  value: string;
  suffix?: string;
}

function SummaryStat({ label, value, suffix }: SummaryStatProps) {
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

interface BacklogPillProps {
  label: string;
  count: number;
  total: number;
}

function BacklogPill({ label, count, total }: BacklogPillProps) {
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

interface FocusListProps {
  title: string;
  items: string[];
  emptyLabel: string;
  tone: "warning" | "positive";
}

function FocusList({ title, items, emptyLabel, tone }: FocusListProps) {
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
