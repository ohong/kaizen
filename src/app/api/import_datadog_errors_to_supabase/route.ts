import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type ImportRequest = {
  days: number;
  service?: string;
  env?: string;
  status?: string; // overrides default status:error if provided
  query?: string; // additional Datadog query segments
  tags?: string[]; // array of tag filters like ["team:core", "version:1.2.3"]
  limitPerPage?: number; // Datadog page size (max 1000). Defaults to 100
  maxPages?: number; // safety cap on pages fetched. Defaults to 50
};

type DatadogLogEvent = {
  id: string;
  attributes?: {
    timestamp?: string;
    message?: string;
    status?: string;
    service?: string;
    env?: string;
    tags?: string[];
    // accept other arbitrary fields
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback;
}

function buildDatadogQuery(params: ImportRequest): string {
  const filters: string[] = [];
  // default to errors if status not explicitly provided
  filters.push(params.status ? `status:${params.status}` : 'status:error');
  if (params.service) filters.push(`service:${params.service}`);
  if (params.env) filters.push(`env:${params.env}`);
  if (params.tags && Array.isArray(params.tags)) {
    for (const tag of params.tags) {
      if (typeof tag === 'string' && tag.trim().length > 0) {
        filters.push(tag.trim());
      }
    }
  }
  if (params.query) filters.push(params.query);
  return filters.join(' ');
}

function parseEnvFromTags(tags: string[] | undefined): string | undefined {
  if (!tags) return undefined;
  for (const t of tags) {
    if (t.startsWith('env:')) return t.substring(4);
  }
  return undefined;
}

async function fetchDatadogLogsPage(args: {
  site: string;
  apiKey: string;
  appKey: string;
  fromISO: string;
  toISO: string;
  query: string;
  limit: number;
  cursor?: string;
  attempt?: number;
}): Promise<{ data: DatadogLogEvent[]; nextCursor?: string }>
{
  const {
    site,
    apiKey,
    appKey,
    fromISO,
    toISO,
    query,
    limit,
    cursor,
    attempt = 1,
  } = args;

  const url = `https://api.${site}/api/v2/logs/events/search`;
  const body: Record<string, unknown> = {
    filter: { from: fromISO, to: toISO, query },
    sort: 'timestamp',
    page: { limit },
  };
  if (cursor) (body.page as Record<string, unknown>).cursor = cursor;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DD-API-KEY': apiKey,
      'DD-APPLICATION-KEY': appKey,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429 && attempt <= 5) {
    // Basic exponential backoff on rate limit
    const backoffMs = 250 * Math.pow(2, attempt - 1);
    await new Promise((r) => setTimeout(r, backoffMs));
    return fetchDatadogLogsPage({ ...args, attempt: attempt + 1 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Datadog API error ${res.status}: ${res.statusText} ${text ? '- ' + text : ''}`
    );
  }

  const json = await res.json();
  const events: DatadogLogEvent[] = Array.isArray(json?.data) ? json.data : [];
  const nextCursor: string | undefined = json?.meta?.page?.after;
  return { data: events, nextCursor };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ImportRequest>;

    if (typeof body.days !== 'number' || !isFinite(body.days) || body.days <= 0) {
      return NextResponse.json({ error: 'Invalid or missing "days" (positive number required)' }, { status: 400 });
    }

    const days = Math.floor(body.days);
    const limitPerPage = Math.min(Math.max((body.limitPerPage ?? 100), 1), 1000);
    const maxPages = Math.min(Math.max((body.maxPages ?? 50), 1), 200);

    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    const fromISO = from.toISOString();
    const toISO = to.toISOString();

    const query = buildDatadogQuery({
      days,
      service: body.service,
      env: body.env,
      status: body.status,
      query: body.query,
      tags: body.tags,
    } as ImportRequest);

    const DATADOG_API_KEY = requireEnv('DATADOG_API_KEY');
    const DATADOG_APP_KEY = requireEnv('DATADOG_APP_KEY');
    const DATADOG_SITE = optionalEnv('DATADOG_SITE', 'datadoghq.com')!;

    const SUPABASE_URL = optionalEnv('SUPABASE_URL') || optionalEnv('NEXT_PUBLIC_SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = optionalEnv('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({
        error: 'Missing Supabase configuration. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in the environment.'
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let cursor: string | undefined;
    let totalProcessed = 0;
    let totalInserted = 0;
    let pages = 0;

    while (pages < maxPages) {
      const { data, nextCursor } = await fetchDatadogLogsPage({
        site: DATADOG_SITE,
        apiKey: DATADOG_API_KEY,
        appKey: DATADOG_APP_KEY,
        fromISO,
        toISO,
        query,
        limit: limitPerPage,
        cursor,
      });

      pages += 1;
      totalProcessed += data.length;

      if (data.length === 0) {
        cursor = undefined;
        break;
      }

      // Map Datadog events to table rows
      const rows = data.map((e) => {
        const attrs = (e?.attributes ?? {}) as DatadogLogEvent['attributes'];
        const tags = (attrs?.tags ?? []) as string[];
        const env = attrs?.env ?? parseEnvFromTags(tags);
        return {
          datadog_event_id: e.id,
          occurred_at: attrs?.timestamp ?? null,
          status: attrs?.status ?? null,
          service: attrs?.service ?? null,
          env: env ?? null,
          message: attrs?.message ?? null,
          tags: Array.isArray(tags) ? tags : null,
          attributes: attrs ?? {},
        } as Record<string, unknown>;
      });

      // Upsert page rows into Supabase
      const { error } = await supabase
        .from('datadog_errors')
        .upsert(rows, { onConflict: 'datadog_event_id' });

      if (error) {
        return NextResponse.json({
          error: `Supabase insert failed: ${error.message}`,
          hint: 'Check RLS policies or use service role key.',
        }, { status: 500 });
      }

      // We cannot know exact inserted vs updated without returning data; estimate by page size
      totalInserted += rows.length;

      if (!nextCursor) {
        break;
      }
      cursor = nextCursor;
    }

    return NextResponse.json({
      ok: true,
      summary: {
        from: fromISO,
        to: toISO,
        query,
        pages,
        processed: totalProcessed,
        upserted: totalInserted,
      },
    });
  } catch (err: unknown) {
    const message = (err instanceof Error) ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


