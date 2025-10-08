"use client";

interface FeedbackComposerProps {
  subject: string;
  body: string;
  onChange: (data: { subject?: string; body?: string }) => void;
}

const aggregateMetrics = [
  { label: "Positive sentiment", value: "68%", helper: "+5 pp vs. last pulse" },
  { label: "AI-assisted merges", value: "74%", helper: "+12 merges week-over-week" },
  { label: "Frustration mentions", value: "18%", helper: "Down 6 pp" },
  { label: "Survey participation", value: "27 responses", helper: "Goal: 35" },
];

const topThemes = [
  {
    title: "AI reduces shallow review time",
    summary:
      "Engineers say Copilot handles boilerplate effectively, freeing time for deeper architectural reviews.",
    impact: "High",
  },
  {
    title: "Local environment setup still noisy",
    summary:
      "New hires lose ~2 hours weekly resolving dependency drift; they want preflight scripts and clearer docs.",
    impact: "Medium",
  },
  {
    title: "Desire for guided AI prompts",
    summary:
      "Teams want a shared prompt library to standardize how they nudge LLMs for Supabase-specific patterns.",
    impact: "Medium",
  },
];

const quickWins = [
  "Ship the Terraform bootstrapper to shrink onboarding time",
  "Publish the review checklist for AI-generated code blocks",
  "Pilot a prompt-of-the-week channel with curated language",
];

const spotlightQuotes = [
  {
    author: "dev05@supbase.com",
    quote:
      "The AI pair feels like a junior dev who never tires, but I still need clearer guardrails before merging its code.",
  },
  {
    author: "dev12@supbase.com",
    quote:
      "Setting up the analytics workspace ate half a day - if we script that, I'd try more experiments with AI debugging.",
  },
  {
    author: "markmorgan.dev@gmail.com",
    quote:
      "I'd love prompt examples tied to our main services; reinventing phrasing each time is the biggest drag right now.",
  },
];

export function FeedbackComposer({ subject, body, onChange }: FeedbackComposerProps) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 pb-16">
      <section className="hud-panel hud-corner hud-scanline border border-[var(--hud-border)] bg-[var(--hud-bg)]/80 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
              ◤ Developer Experience Hub
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--hud-text-bright)]">
              Compose Survey
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--hud-text-dim)]">
              Draft the subject and body that will go out to your engineers. Edits here update the next send window automatically.
            </p>
          </div>
          <div className="self-start rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-3 text-right md:self-center">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Next send window
            </p>
            <p className="mt-2 font-mono text-sm text-[var(--hud-text-bright)]">
              Wednesday @ 9:00 AM PT
            </p>
          </div>
        </div>
      </section>

      <section className="hud-panel hud-corner border border-[var(--hud-border)] bg-[var(--hud-bg)]/90 p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Compose survey
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--hud-text-bright)]">
              Developer Experience Pulse Check
            </h2>
          </div>
          <button
            type="button"
            className="hud-glow border border-[var(--hud-accent)] bg-[var(--hud-bg-elevated)] px-4 py-2 font-mono text-xs uppercase tracking-wider text-[var(--hud-accent)] transition-all duration-200 hover:bg-[var(--hud-accent)] hover:text-[var(--hud-bg)]"
            onClick={() => window.alert("Survey sending is not wired up yet - stub only.")}
          >
            Send Survey
          </button>
        </div>

        <div className="space-y-5">
          <label className="block text-sm text-[var(--hud-text-dim)]">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(event) => onChange({ subject: event.target.value })}
              className="mt-2 w-full rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-2 font-mono text-sm text-[var(--hud-text-bright)] focus:border-[var(--hud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--hud-accent)]/40"
            />
          </label>

          <label className="block text-sm text-[var(--hud-text-dim)]">
            Body
            <textarea
              value={body}
              onChange={(event) => onChange({ body: event.target.value })}
              rows={12}
              className="mt-2 w-full rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-3 py-3 font-mono text-sm leading-6 text-[var(--hud-text-bright)] focus:border-[var(--hud-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--hud-accent)]/40"
            />
          </label>

          <div className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-3 text-xs text-[var(--hud-text-dim)]">
            Tip: Edit the prompts above to match the specific team or sprint you want to survey. Changes here will be used the next time you launch the campaign.
          </div>
        </div>
      </section>
    </div>
  );
}

export function FeedbackInsights() {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 px-8 pb-16">
      <section className="hud-panel hud-corner hud-scanline border border-[var(--hud-border)] bg-[var(--hud-bg)]/80 p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--hud-text-dim)]">
              ◤ Developer Experience Hub
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--hud-text-bright)]">
              Survey Insights Digest
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--hud-text-dim)]">
              Review AI-synthesised insights from the latest pulse so you can coach the team and close the loop on feedback quickly.
            </p>
          </div>
          <span className="self-start rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-3 font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)] md:self-center">
            Updated 2h ago
          </span>
        </div>
      </section>

      <section className="hud-panel hud-corner border border-[var(--hud-border)] bg-[var(--hud-bg)]/90 p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
          Latest pulse stats
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {aggregateMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-3"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--hud-text-dim)]">
                {metric.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">
                {metric.value}
              </p>
              <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{metric.helper}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="hud-panel hud-corner border border-[var(--hud-border)] bg-[var(--hud-bg)]/90 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
                LLM summary themes
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--hud-text-bright)]">
                What engineers are talking about
              </h2>
            </div>
            <span className="rounded-full border border-[var(--hud-accent)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-accent)]">
              Top themes
            </span>
          </div>

          <div className="mt-6 space-y-5">
            {topThemes.map((theme) => (
              <div
                key={theme.title}
                className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--hud-text-bright)]">
                    {theme.title}
                  </h3>
                  <span className="rounded border border-[var(--hud-border)] px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--hud-text-dim)]">
                    Impact: {theme.impact}
                  </span>
                </div>
                <p className="mt-2 text-sm text-[var(--hud-text-dim)]">{theme.summary}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="hud-panel hud-corner border border-[var(--hud-border)] bg-[var(--hud-bg)]/90 p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Spotlight quotes
          </p>
          <div className="mt-4 space-y-4">
            {spotlightQuotes.map((entry) => (
              <blockquote
                key={entry.author}
                className="rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-4 text-sm text-[var(--hud-text-dim)]"
              >
                <p className="text-[var(--hud-text-bright)]">&quot;{entry.quote}&quot;</p>
                <footer className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[var(--hud-text-dim)]">
                  {entry.author}
                </footer>
              </blockquote>
            ))}
          </div>

          <div className="mt-6 rounded border border-[var(--hud-border)] bg-[var(--hud-bg-elevated)] px-4 py-4">
            <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
              Quick wins recommended
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-[var(--hud-text-dim)]">
              {quickWins.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
