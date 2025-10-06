"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { DatadogError } from "@/lib/types/database";
import { DistributionChart } from "@/components/charts";
import { resolveServiceName } from "@/lib/errors";
import {
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DatadogErrorsSectionProps {
  owner: string;
  name: string;
}

type TimeRangeDays = 1 | 7 | 30;

export function DatadogErrorsSection({ owner, name }: DatadogErrorsSectionProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeDays>(7);
  const [repoId, setRepoId] = useState<string | null>(null);
  const [errors, setErrors] = useState<DatadogError[]>([]);

  // Load repository id for owner/name
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
          if (!isCancelled) {
            setRepoId(null);
          }
          return;
        }
        if (!isCancelled) {
          setRepoId(data.id);
        }
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

  // Load errors for repository and time range
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
      return date.toISOString().slice(0, 13) + ':00:00Z'; // Round to hour
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

    // Fill missing hours in range with zeros for smooth timeline
    const hours: string[] = [];
    const start = new Date();
    start.setDate(start.getDate() - timeRange);
    start.setHours(0, 0, 0, 0); // Start of day
    
    for (let i = 0; i < timeRange * 24; i++) {
      const d = new Date(start);
      d.setHours(start.getHours() + i);
      hours.push(d.toISOString().slice(0, 13) + ':00:00Z');
    }
    const timeline = hours.map((h) => ({ 
      date: new Date(h).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: 'numeric',
        hour12: true 
      }), 
      count: byDateMap.get(h) || 0 
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

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <CollapsiblePanel
          title="Errors over time"
          description="Trend of error events in the selected window."
        >
          <div className="h-[320px]">
            {loading ? (
              <EmptyState label="Loading..." />
            ) : summary.timeline.length === 0 ? (
              <EmptyState label="No errors in selected period" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart data={summary.timeline} margin={{ top: 15, right: 20, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #334155" }}
                    labelStyle={{ color: "#cbd5e1" }}
                    itemStyle={{ color: "#cbd5e1" }}
                    formatter={(value: number | string) => [value, "Errors"]}
                  />
                  <Line type="monotone" dataKey="count" stroke="#ef4444" strokeWidth={2} dot={false} />
                </ReLineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Services impacted"
          description="Service-level distribution of incidents."
        >
          <div className="h-[320px]">
            <DistributionChart data={summary.byService} title="By service" yLabel="Errors" />
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Environment spread"
          description="See which environment is generating noise."
        >
          <div className="h-[320px]">
            <DistributionChart data={summary.byEnv} title="By environment" yLabel="Errors" />
          </div>
        </CollapsiblePanel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CollapsiblePanel
          title="Recent errors"
          description="The latest events in this window. Expand for message and metadata."
        >
          {loading ? (
            <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">Loading...</div>
          ) : summary.recent.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">No recent errors</div>
          ) : (
            <ul className="mt-3 divide-y divide-[var(--hud-border)]">
              {summary.recent.map((e) => (
                <li key={e.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="max-w-2xl truncate text-sm text-[var(--hud-text)]" title={e.message || "(no message)"}>
                        {e.message || "(no message)"}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge tone="danger">{e.status || "error"}</Badge>
                        <Badge tone="info">{resolveServiceName(e.service, e.id)}</Badge>
                        {e.env && <Badge tone="neutral">{e.env}</Badge>}
                      </div>
                    </div>
                    <time className="whitespace-nowrap text-xs text-[var(--hud-text-dim)]">
                      {new Date(e.occurred_at).toLocaleString()}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CollapsiblePanel>

        <CollapsiblePanel
          title="Top error messages"
          description="Most-frequent signatures for the selected range."
        >
          {loading ? (
            <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">Loading...</div>
          ) : summary.topMessages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-[var(--hud-text-dim)]">No messages</div>
          ) : (
            <ol className="mt-3 space-y-2 text-sm text-[var(--hud-text)]">
              {summary.topMessages.map((m, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-[var(--hud-text-dim)]">{i + 1}.</span>
                  <div className="flex-1">
                    <p className="line-clamp-2" title={m.message}>{m.message}</p>
                    <p className="mt-1 text-xs text-[var(--hud-text-dim)]">{m.count} occurrences</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CollapsiblePanel>
      </div>
    </section>
  );
}

function SummaryTile({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="hud-panel hud-corner p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--hud-text-bright)]">
        {loading ? "…" : value}
      </p>
    </div>
  );
}

function CollapsiblePanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="hud-panel hud-corner p-3">
      <details className="group">
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm text-[var(--hud-text)] transition-colors group-open:bg-[var(--hud-bg-elevated)]">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--hud-text-dim)]">{title}</span>
            <span className="text-sm text-[var(--hud-text)]">{description}</span>
          </div>
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--hud-border)] text-[var(--hud-text-dim)] transition-transform duration-150 group-open:rotate-90"
            aria-hidden
          >
            ▸
          </span>
        </summary>
        <div className="mt-4">{children}</div>
      </details>
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

function Badge({ children, tone }: { children: React.ReactNode; tone: "danger" | "info" | "neutral" }) {
  const color =
    tone === "danger"
      ? "text-[#ef4444] border-[#ef4444]/40 bg-[#ef4444]/10"
      : tone === "info"
      ? "text-[#3b82f6] border-[#3b82f6]/40 bg-[#3b82f6]/10"
      : "text-[var(--hud-text-dim)] border-[var(--hud-border)] bg-[var(--hud-bg)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs ${color}`}>{children}</span>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-[var(--hud-text-dim)]">{label}</p>
    </div>
  );
}

export default DatadogErrorsSection;
