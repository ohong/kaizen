interface GuidedActionsPanelProps {
  onAddRepository: () => void;
  onSync: () => void;
  onOpenReport: () => void;
}

export function GuidedActionsPanel({ onAddRepository, onSync, onOpenReport }: GuidedActionsPanelProps) {
  const actions: Array<{ title: string; description: string; ctaLabel: string; onClick: () => void; helper: string }> = [
    {
      title: "Analyze another repository",
      description: "Pull metrics for any GitHub project—public or private—using the server token.",
      ctaLabel: "Add repository",
      onClick: onAddRepository,
      helper: "Private repos require a GitHub token with read access.",
    },
    {
      title: "Refresh your metrics",
      description: "Re-sync pull requests, developer metrics, and benchmarks for the current repo.",
      ctaLabel: "Sync now",
      onClick: onSync,
      helper: "Runs in the background; leave the page open to watch updates roll in.",
    },
    {
      title: "Share the exec report",
      description: "Email the Kaizen exec report and charts to leadership or team leads.",
      ctaLabel: "Send exec report",
      onClick: onOpenReport,
      helper: "Uses the recipient list you configure in the report modal.",
    },
  ];

  return (
    <section className="hud-panel hud-corner p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">Quick guidance</p>
      <h2 className="mt-2 text-xl font-semibold text-[var(--hud-text-bright)]">What would you like to do?</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {actions.map((action) => (
          <details key={action.title} className="group rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)]">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm text-[var(--hud-text)] transition-colors group-open:text-[var(--hud-text-bright)]">
              <span className="font-medium">{action.title}</span>
              <span className="text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90">▸</span>
            </summary>
            <div className="space-y-3 border-t border-[var(--hud-border)] px-4 pb-4 pt-3 text-sm text-[var(--hud-text-dim)]">
              <p>{action.description}</p>
              <p className="text-[var(--hud-text-dim)]/80">{action.helper}</p>
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center justify-center rounded border border-[var(--hud-accent)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--hud-accent)] transition-colors hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
              >
                {action.ctaLabel}
              </button>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
