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

export function OverviewSection({ repository, wins, focusAreas, actionGroups }: OverviewSectionProps) {
  const [copy, setCopy] = useState<OverviewCopy>({ working: [], toWorkOn: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

        const data = (await response.json()) as { working?: string[]; toWorkOn?: string[] };

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
    <section className="hud-panel hud-corner hud-scanline p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">
            Overview
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-[var(--hud-text-bright)]">
            Where to steer next
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--hud-text-dim)]">
            The top wins and risks for {repository.owner}/{repository.name}. Direct your team toward the
            biggest opportunities and unblock the work that needs attention first.
          </p>
        </div>
        {loading && (
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--hud-text-dim)]">
            Summarising…
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
          title="What To Work On"
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
  const accent = tone === "positive" ? "text-[var(--hud-accent)]" : "text-[#ffaa00]";
  const border = tone === "positive" ? "border-[var(--hud-accent)]/30" : "border-[#ffaa00]/30";
  const background = tone === "positive" ? "bg-[var(--hud-accent)]/5" : "bg-[#ffaa00]/5";

  return (
    <div className={`hud-panel hud-corner p-5 ${border} ${background}`}>
      <p className={`font-mono text-xs uppercase tracking-wider ${accent}`}>{title}</p>
      <div className="mt-3 space-y-3 text-sm text-[var(--hud-text)]">
        {loading ? (
          <SkeletonList count={3} />
        ) : items.length === 0 ? (
          <p className="text-[var(--hud-text-dim)]">We need more data to highlight insights here.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${title}-${index}`} className="flex items-start gap-3">
              <span className={`font-mono text-sm ${accent}`}>#{index + 1}</span>
              <p className="leading-relaxed">{item}</p>
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
        <div key={index} className="h-4 animate-pulse rounded bg-[var(--hud-border)]/50" />
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
