"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { DatadogError } from "@/lib/types/database";
import { resolveServiceName } from "@/lib/errors";
import { useWidgets } from "@/hooks/useWidgets";
import { WidgetGrid } from "./WidgetGrid";
import { WidgetCatalog } from "./WidgetCatalog";
import {
  ErrorsOverTimeWidget,
  ServicesImpactedWidget,
  EnvironmentSpreadWidget,
  RecentErrorsWidget,
  TopErrorMessagesWidget,
} from "./registry";

interface WidgetizedErrorsSectionProps {
  owner: string;
  name: string;
}

type TimeRangeDays = 1 | 7 | 30;

export function WidgetizedErrorsSection({ owner, name }: WidgetizedErrorsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeDays>(7);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [errors, setErrors] = useState<DatadogError[]>([]);

  const {
    widgets,
    editMode,
    removeWidget,
    resizeWidget,
    reorderWidget,
    addWidget,
    resetWidgets,
    toggleEditMode,
  } = useWidgets("errors");

  // Load repository id
  useEffect(() => {
    let isCancelled = false;
    async function loadRepoId() {
      setError(null);
      try {
        const { data, error } = await supabase
          .from("repositories")
          .select("id")
          .eq("owner", owner)
          .eq("name", name)
          .maybeSingle<{ id: string }>();

        if (error) throw error;
        if (!data) {
          if (!isCancelled) setRepoId(null);
          return;
        }
        if (!isCancelled) setRepoId(data.id);
      } catch (e: unknown) {
        if (!isCancelled) {
          const message = e instanceof Error ? e.message : "Failed to load repository";
          setError(message);
        }
      }
    }
    loadRepoId();
    return () => {
      isCancelled = true;
    };
  }, [owner, name]);

  // Load errors
  useEffect(() => {
    if (!repoId) {
      setErrors([]);
      setLoading(false);
      return;
    }
    const currentRepoId = repoId;
    let isCancelled = false;
    async function loadErrors() {
      setLoading(true);
      setError(null);
      try {
        const since = new Date();
        since.setDate(since.getDate() - timeRange);
        const { data, error } = await supabase
          .from("datadog_errors")
          .select("*")
          .eq("repository_id", currentRepoId)
          .gte("occurred_at", since.toISOString())
          .order("occurred_at", { ascending: false })
          .limit(500);
        if (error) throw error;
        if (!isCancelled) setErrors(data ?? []);
      } catch (e: unknown) {
        if (!isCancelled) {
          setErrors([]);
          const message = e instanceof Error ? e.message : "Failed to load Datadog errors";
          setError(message);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    loadErrors();
    return () => {
      isCancelled = true;
    };
  }, [repoId, timeRange]);

  const summary = useMemo(() => {
    if (!errors.length) {
      return {
        total: 0,
        byService: [] as { category: string; value: number }[],
        byEnv: [] as { category: string; value: number }[],
        timeline: [] as { date: string; count: number }[],
        recent: [] as DatadogError[],
        topMessages: [] as { message: string; count: number }[],
      };
    }

    const byServiceMap = new Map<string, number>();
    const byEnvMap = new Map<string, number>();
    const byDateMap = new Map<string, number>();
    const byMessageMap = new Map<string, number>();

    const normalizeHour = (iso: string) => {
      const date = new Date(iso);
      return date.toISOString().slice(0, 13) + ":00:00Z";
    };
    const normalizeMessage = (msg: string | null) => (msg ? msg.trim() : "<no message>");

    for (const e of errors) {
      const service = resolveServiceName(e.service, e.id);
      const env = e.env || "unknown";
      const hour = normalizeHour(e.occurred_at);
      const message = normalizeMessage(e.message);

      byServiceMap.set(service, (byServiceMap.get(service) || 0) + 1);
      byEnvMap.set(env, (byEnvMap.get(env) || 0) + 1);
      byDateMap.set(hour, (byDateMap.get(hour) || 0) + 1);
      byMessageMap.set(message, (byMessageMap.get(message) || 0) + 1);
    }

    const hours: string[] = [];
    const start = new Date();
    start.setDate(start.getDate() - timeRange);
    start.setHours(0, 0, 0, 0);

    for (let i = 0; i < timeRange * 24; i++) {
      const d = new Date(start);
      d.setHours(start.getHours() + i);
      hours.push(d.toISOString().slice(0, 13) + ":00:00Z");
    }
    const timeline = hours.map((h) => ({
      date: new Date(h).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        hour12: true,
      }),
      count: byDateMap.get(h) || 0,
    }));

    const mapToSortedArray = (m: Map<string, number>) =>
      Array.from(m.entries())
        .map(([category, value]) => ({ category, value }))
        .sort((a, b) => b.value - a.value);

    const byService = mapToSortedArray(byServiceMap).slice(0, 10);
    const byEnv = mapToSortedArray(byEnvMap).slice(0, 10);

    const topMessages = Array.from(byMessageMap.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recent = [...errors].slice(0, 12);

    return {
      total: errors.length,
      byService,
      byEnv,
      timeline,
      recent,
      topMessages,
    };
  }, [errors, timeRange]);

  const enabledWidgetTypes = new Set(
    widgets.filter((w) => w.enabled && w.type.startsWith("errors-") || w.type.includes("error")).map((w) => w.type)
  );

  return (
    <section>
      <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--hud-text-bright)]">Operational errors</h2>
          <p className="text-sm text-[var(--hud-text-dim)]">
            Scan recent incidents and dig deeper only where you need to intervene.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeToggle value={timeRange} onChange={setTimeRange} />
          <button
            onClick={toggleEditMode}
            className={`rounded-lg px-3 py-1 text-xs ${
              editMode
                ? "bg-[var(--hud-accent)]/20 text-[var(--hud-accent)]"
                : "border border-[var(--hud-border)] text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
            }`}
          >
            {editMode ? "Done" : "Customize"}
          </button>
          {editMode && (
            <button
              onClick={resetWidgets}
              className="rounded-lg border border-[var(--hud-border)] px-3 py-1 text-xs text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-[var(--hud-border)] bg-[var(--hud-bg)] p-3 text-[var(--hud-warning)]">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Total errors" value={summary.total} loading={loading} />
        <SummaryTile label="Services impacted" value={summary.byService.length} loading={loading} />
        <SummaryTile label="Distinct messages" value={summary.topMessages.length} loading={loading} />
      </div>

      {editMode && (
        <div className="mb-6">
          <WidgetCatalog onAddWidget={addWidget} enabledWidgetTypes={enabledWidgetTypes} />
        </div>
      )}

      <WidgetGrid
        widgets={widgets.filter((w) =>
          w.type === "errors-over-time" ||
          w.type === "services-impacted" ||
          w.type === "environment-spread" ||
          w.type === "recent-errors" ||
          w.type === "top-error-messages"
        )}
        onRemove={removeWidget}
        onResize={resizeWidget}
        onReorder={reorderWidget}
        editMode={editMode}
      >
        {(widget) => {
          switch (widget.type) {
            case "errors-over-time":
              return <ErrorsOverTimeWidget timeline={summary.timeline} loading={loading} />;
            case "services-impacted":
              return <ServicesImpactedWidget byService={summary.byService} />;
            case "environment-spread":
              return <EnvironmentSpreadWidget byEnv={summary.byEnv} />;
            case "recent-errors":
              return <RecentErrorsWidget recent={summary.recent} loading={loading} />;
            case "top-error-messages":
              return <TopErrorMessagesWidget topMessages={summary.topMessages} loading={loading} />;
            default:
              return null;
          }
        }}
      </WidgetGrid>
    </section>
  );
}

function SummaryTile({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="hud-panel hud-corner p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">{loading ? "…" : value}</p>
    </div>
  );
}

function TimeRangeToggle({ value, onChange }: { value: TimeRangeDays; onChange: (v: TimeRangeDays) => void }) {
  const options: { label: string; value: TimeRangeDays }[] = [
    { label: "24h", value: 1 },
    { label: "7d", value: 7 },
    { label: "30d", value: 30 },
  ];
  return (
    <div className="flex overflow-hidden rounded-lg border border-[var(--hud-border)]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 text-xs ${
            value === opt.value
              ? "bg-[var(--hud-accent)]/20 text-[var(--hud-accent)]"
              : "text-[var(--hud-text-dim)] hover:bg-[var(--hud-bg)]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
