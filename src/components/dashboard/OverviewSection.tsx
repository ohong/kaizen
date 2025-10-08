"use client";

import { useEffect, useMemo, useState } from "react";

import type { ActionGroup } from "@/lib/dashboard";

interface OverviewSectionProps {
  repository: { owner: string; name: string };
  wins: string[];
  focusAreas: string[];
  actionGroups: ActionGroup[];
}

interface OverviewCopy {
  working: string[];
  toWorkOn: string[];
}

const MAX_ITEM_LENGTH = 140;

export function OverviewSection({
  repository,
  wins,
  focusAreas,
  actionGroups,
}: OverviewSectionProps) {
  const [copy, setCopy] = useState<OverviewCopy>({ working: [], toWorkOn: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigationAnchors = [
    { href: "#overview", label: "Overview" },
    { href: "#metrics", label: "Metrics" },
    { href: "#benchmarks", label: "Benchmarks" },
    { href: "#blockers", label: "Blockers" },
    { href: "#team", label: "Team" },
  ];

  const payload = useMemo(() => {
    const trimmedQueue = actionGroups.slice(0, 4).map((group) => ({
      title: group.title,
      description: group.description,
      prCount: group.prs.length,
      samplePRs: group.prs.slice(0, 2).map((pr) => ({
        title: pr.title,
        author: pr.author ?? null,
        updatedAt: pr.updated_at ?? null,
      })),
    }));

    return {
      repository,
      wins,
      focusAreas,
      actionQueue: trimmedQueue,
    };
  }, [repository, wins, focusAreas, actionGroups]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadOverview() {
      if (!wins.length && !focusAreas.length && !actionGroups.length) {
        setCopy({ working: [], toWorkOn: [] });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to summarise overview");
        }

        const data = (await response.json()) as {
          working?: string[];
          toWorkOn?: string[];
        };

        if (isMounted) {
          setCopy({
            working: sanitiseMessages(data.working ?? []),
            toWorkOn: sanitiseMessages(data.toWorkOn ?? []),
          });
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error("OverviewSection error:", err);
        if (isMounted) {
          setError("Unable to refresh overview copy");
          setCopy({
            working: sanitiseMessages(wins.slice(0, 3)),
            toWorkOn: sanitiseMessages(focusAreas.slice(0, 3)),
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadOverview();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [payload, wins, focusAreas, actionGroups]);

  return (
    <section className="hud-panel-prominent hud-corner p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="hud-badge">Executive Summary</p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--hud-text-bright)]">
            Engineering Efficiency Overview
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--hud-text)]">
            The top wins and risks for {repository.owner}/{repository.name}.
            Direct your team toward the biggest opportunities and unblock the
            work that needs attention first.
          </p>
          <nav
            aria-label="Dashboard sections"
            className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--hud-text-dim)]"
          >
            {navigationAnchors.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="group relative overflow-hidden rounded-full border border-[var(--hud-border)] px-3 py-1 transition-colors duration-200 hover:border-[var(--hud-accent)] hover:text-[var(--hud-accent)]"
              >
                <span className="relative z-10">{anchor.label}</span>
                <span className="absolute inset-0 -z-0 translate-y-full bg-[var(--hud-accent)]/10 transition-transform duration-200 group-hover:translate-y-0" />
              </a>
            ))}
          </nav>
        </div>
        {loading && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-accent)]">
            Analyzing…
          </span>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded border border-[var(--hud-warning)]/40 bg-[var(--hud-warning)]/10 px-3 py-2 text-xs text-[var(--hud-warning)]">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <OverviewList
          title="What’s Working"
          tone="positive"
          items={copy.working}
          loading={loading && !copy.working.length}
        />
        <OverviewList
          title="What To Improve"
          tone="warning"
          items={copy.toWorkOn}
          loading={loading && !copy.toWorkOn.length}
        />
      </div>
    </section>
  );
}

function OverviewList({
  title,
  items,
  tone,
  loading,
}: {
  title: string;
  items: string[];
  tone: "positive" | "warning";
  loading: boolean;
}) {
  const accent =
    tone === "positive"
      ? "text-[var(--hud-success)]"
      : "text-[var(--hud-warning)]";
  const border =
    tone === "positive"
      ? "border-[var(--hud-success)]/40"
      : "border-[var(--hud-warning)]/40";
  const bgGradient =
    tone === "positive"
      ? "bg-gradient-to-br from-[#10b981]/10 to-[#10b981]/5"
      : "bg-gradient-to-br from-[#f59e0b]/10 to-[#f59e0b]/5";

  return (
    <div
      className={`hud-panel-elevated hud-corner p-6 transition-transform duration-200 hover:-translate-y-1 ${border} ${bgGradient}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`h-2 w-2 rounded-full ${tone === "positive" ? "bg-[var(--hud-success)]" : "bg-[var(--hud-warning)]"}`}
        />
        <p
          className={`font-mono text-xs uppercase tracking-wider ${accent} font-semibold`}
        >
          {title}
        </p>
      </div>
      <div className="mt-4 space-y-4 text-sm text-[var(--hud-text)]">
        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <p className="text-[var(--hud-text-dim)]">
            We need more data to highlight insights here.
          </p>
        ) : (
          items.map((item, index) => (
            <div
              key={`${title}-${index}`}
              className="flex items-start gap-3 group"
            >
              <span
                className={`font-mono text-sm ${accent} font-semibold min-w-[1.5rem]`}
              >
                #{index + 1}
              </span>
              <p className="leading-relaxed group-hover:text-[var(--hud-text-bright)] transition-colors">
                {item}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SkeletonList({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded bg-[var(--hud-border)]/50"
        />
      ))}
    </div>
  );
}

function sanitiseMessages(items: string[]) {
  return items
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, 3)
    .map((item) => {
      const trimmed = item.trim();
      if (trimmed.length <= MAX_ITEM_LENGTH) return trimmed;
      return `${trimmed.slice(0, MAX_ITEM_LENGTH - 1)}…`;
    });
}
