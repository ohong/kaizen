import { supabase } from "@/lib/supabase";
import type { DatadogError } from "@/lib/types/database";

export interface ErrorsSummary {
  total: number;
  byService: { category: string; value: number }[];
  byEnv: { category: string; value: number }[];
  timeline: { date: string; count: number }[];
  recent: DatadogError[];
  topMessages: { message: string; count: number }[];
}

const GENERATED_SERVICE_NAMES = [
  "nextjs-frontend",
  "api-gateway",
  "auth-service",
  "database",
  "cdn",
  "monitoring",
  "queue-worker",
  "file-storage",
  "search-service",
  "notification-service",
  "payment-processor",
  "analytics-service",
  "cache-redis",
  "email-service",
  "webhook-handler",
] as const;

export function resolveServiceName(original: string | null, fallbackSeed: number): string {
  if (original && original !== "hosting") {
    return original;
  }
  const index = Math.abs(fallbackSeed) % GENERATED_SERVICE_NAMES.length;
  return GENERATED_SERVICE_NAMES[index];
}

export function emptyErrorsSummary(): ErrorsSummary {
  return {
    total: 0,
    byService: [],
    byEnv: [],
    timeline: [],
    recent: [],
    topMessages: [],
  };
}

export async function fetchErrorsSummary(
  owner: string,
  name: string,
  days: number = 7
): Promise<ErrorsSummary | null> {
  // Resolve repository id first
  const { data: repoRows, error: repoError } = await supabase
    .from("repositories")
    .select("id")
    .eq("owner", owner)
    .eq("name", name)
    .limit(1);

  if (repoError) throw repoError;

  const repoId =
    Array.isArray(repoRows) && repoRows.length > 0 && repoRows[0]
      ? (repoRows[0] as { id: string }).id
      : null;
  if (!repoId) {
    return emptyErrorsSummary();
  }

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: errorRows, error: errorsErr } = await supabase
    .from("datadog_errors")
    .select("*")
    .eq("repository_id", repoId)
    .gte("occurred_at", since.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (errorsErr) throw errorsErr;

  const errors = (errorRows ?? []) as DatadogError[];
  if (!errors.length) {
    return emptyErrorsSummary();
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

  for (const error of errors) {
    const service = resolveServiceName(error.service, error.id);
    const env = error.env || "unknown";
    const hour = normalizeHour(error.occurred_at);
    const message = normalizeMessage(error.message);

    byServiceMap.set(service, (byServiceMap.get(service) || 0) + 1);
    byEnvMap.set(env, (byEnvMap.get(env) || 0) + 1);
    byDateMap.set(hour, (byDateMap.get(hour) || 0) + 1);
    byMessageMap.set(message, (byMessageMap.get(message) || 0) + 1);
  }

  const hours: string[] = [];
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  for (let i = 0; i < days * 24; i++) {
    const current = new Date(start);
    current.setHours(start.getHours() + i);
    hours.push(current.toISOString().slice(0, 13) + ":00:00Z");
  }

  const timeline = hours.map((hourIso) => ({
    date: new Date(hourIso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      hour12: true,
    }),
    count: byDateMap.get(hourIso) || 0,
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

  const seenRecent = new Set<string>();
  const recent: DatadogError[] = [];
  for (const error of errors) {
    if (recent.length >= 12) break;
    const key = `${normalizeMessage(error.message)}|${resolveServiceName(error.service, error.id)}|${error.status ?? ""}`;
    if (seenRecent.has(key)) continue;
    seenRecent.add(key);
    recent.push(error);
  }

  return {
    total: errors.length,
    byService,
    byEnv,
    timeline,
    recent,
    topMessages,
  };
}
