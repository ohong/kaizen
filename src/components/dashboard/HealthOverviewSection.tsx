import type { HealthSummary } from "@/lib/dashboard";
import { formatHours, formatInteger, formatPercent } from "@/lib/format";

interface HealthOverviewSectionProps {
  summary: HealthSummary;
}

export function HealthOverviewSection({ summary }: HealthOverviewSectionProps) {
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
            label="Active contributors"
            value={formatInteger(summary.activeContributors)}
          />
          <SummaryStat label="Avg first review" value={formatHours(summary.avgTimeToFirstReview)} />
          <SummaryStat label="Avg merge time" value={formatHours(summary.avgMergeHours)} />
          <SummaryStat label="Merge rate" value={formatPercent(summary.mergeRate)} />
          <SummaryStat label="Small PR share" value={formatPercent(summary.smallPRShare)} />
        </div>

        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Open PR backlog
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {summary.backlogBuckets.map((bucket) => (
              <BacklogPill
                key={bucket.label}
                label={bucket.label}
                count={bucket.count}
                total={summary.openPrCount}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <FocusList
          title="Focus this sprint"
          tone="warning"
          items={summary.focusAreas}
          emptyLabel="No urgent risks detected"
        />
        <FocusList
          title="What’s working"
          tone="positive"
          items={summary.wins}
          emptyLabel="We need more data to celebrate wins"
        />
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

function FocusList({
  title,
  items,
  emptyLabel,
  tone,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
  tone: "warning" | "positive";
}) {
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
