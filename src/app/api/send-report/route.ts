import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import path from "path";
import { promises as fs } from "fs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipients, payload } = body as { recipients: string[]; payload: any };

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: "Recipients array is required and must not be empty" },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const subject = buildSubject(payload);

    // Best-effort LLM summary using NVIDIA
    const llmSummary = await summarizeWithNvidia(payload);
    const html = generateReportEmailHTML(payload, llmSummary ?? undefined);

    const results = await Promise.allSettled(
      recipients.map(async (email: string) => {
        const { data, error } = await resend.emails.send({
          from: "Kaizen <send@markmdev.com>",
          to: [email],
          subject,
          html,
        });
        if (error) {
          console.error(`Failed to send to ${email}:`, error);
          throw error;
        }
        return { email, messageId: data?.id };
      })
    );

    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<any>).value);
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r, idx) => ({ email: recipients[idx], error: (r as PromiseRejectedResult).reason }));

    return NextResponse.json({
      success: true,
      sent: successful.length,
      failedCount: failed.length,
      successful,
      failed,
      message: `Successfully sent ${successful.length} of ${recipients.length} report emails`,
    });
  } catch (error) {
    console.error("Error sending report emails:", error);
    return NextResponse.json(
      { error: "Failed to send report emails", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function buildSubject(payload: any): string {
  const repo = payload?.repository ? `${payload.repository.owner}/${payload.repository.name}` : "Repository";
  const score = payload?.health?.healthScore ?? "—";
  return `Kaizen Delivery Report • ${repo} • Health ${score}`;
}

function generateReportEmailHTML(payload: any, llmSummary?: string): string {
  const repoOwner = payload?.repository?.owner ?? "";
  const repoName = payload?.repository?.name ?? "";
  const healthScore = payload?.health?.healthScore ?? "—";
  const healthSummary = payload?.health?.summary ?? "";
  const latestSync = payload?.latestSync ?? null;
  const openPrs = payload?.health?.openPrCount ?? 0;
  const stalePrs = payload?.health?.stalePrCount ?? 0;
  const throughput = payload?.health?.throughputPerWeek ?? null;
  const mergeRate = payload?.health?.mergeRate ?? null;
  const avgMerge = payload?.health?.avgMergeHours ?? null;
  const avgFirstReview = payload?.health?.avgTimeToFirstReview ?? null;
  const errorsTotal = payload?.errors?.total ?? 0;
  const topMessages: { message: string; count: number }[] = payload?.errors?.topMessages ?? [];

  const fmt = (v: any) => (v === null || v === undefined ? "—" : String(v));
  const summaryHtml = llmSummary ? formatSummaryHtml(llmSummary) : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kaizen Delivery Report</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#1e293b;margin:0;padding:24px}
    .container{max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1)}
    .header{padding:20px 24px;border-bottom:2px solid #00ff88;background:#f8fafc}
    .logo{font-family:'JetBrains Mono',monospace;font-weight:800;color:#00ff88;letter-spacing:.2em}
    h1{margin:6px 0 0 0;font-size:22px;color:#1e293b;font-weight:600}
    .section{padding:20px 24px;border-top:1px solid #e2e8f0}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}
    .muted{color:#64748b;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em}
    .kpi{font-size:18px;color:#00ff88;font-weight:700}
    .pill{display:inline-block;border:1px solid #cbd5e1;background:#f1f5f9;color:#475569;border-radius:999px;padding:2px 8px;font-size:12px;margin-right:6px;margin-bottom:4px}
    ol{margin:6px 0 0 18px;padding:0}
    li{margin:4px 0;color:#1e293b}
    .card div:not(.muted){color:#1e293b;font-weight:500}
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">KAIZEN</div>
        <h1>Delivery Report • ${repoOwner}/${repoName}</h1>
        <div class="muted">Latest Sync: ${latestSync ? new Date(latestSync).toLocaleString() : "—"}</div>
      </div>

      <div class="section">
        <div class="grid">
          <div class="card">
            <div class="muted">Composite Score</div>
            <div class="kpi">${fmt(healthScore)}</div>
          </div>
          <div class="card">
            <div class="muted">Summary</div>
            <div>${healthSummary}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="grid">
          <div class="card"><div class="muted">Throughput / week</div><div>${fmt(throughput)}</div></div>
          <div class="card"><div class="muted">Merge rate</div><div>${mergeRate !== null ? `${mergeRate.toFixed(1)}%` : '—'}</div></div>
          <div class="card"><div class="muted">Avg merge time</div><div>${avgMerge !== null ? `${avgMerge.toFixed(1)}h` : '—'}</div></div>
          <div class="card"><div class="muted">Avg first review</div><div>${avgFirstReview !== null ? `${avgFirstReview.toFixed(1)}h` : '—'}</div></div>
          <div class="card"><div class="muted">Open PRs</div><div>${fmt(openPrs)}</div></div>
          <div class="card"><div class="muted">Stale PRs (>3d)</div><div>${fmt(stalePrs)}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="muted">Operational Errors (7d)</div>
        <div style="margin-top:6px">
          <span class="pill">Total ${fmt(errorsTotal)}</span>
          ${topMessages.map((m) => `<span class="pill">${escapeHtml(m.message).slice(0,60)} (${m.count})</span>`).join('')}
        </div>
      </div>

      <div class="section">
        <div class="muted">Top Developers</div>
        <ol>
          ${Array.isArray(payload?.developers?.top) ? payload.developers.top.map((d: any) => `<li>${escapeHtml(d.author)} — ${d.overallScore}</li>`).join('') : ''}
        </ol>
      </div>

      <div class="section">
        <div class="muted">Needs Attention</div>
        <ol>
          ${Array.isArray(payload?.developers?.needsAttention) ? payload.developers.needsAttention.map((d: any) => `<li>${escapeHtml(d.author)} — ${d.overallScore}</li>`).join('') : ''}
        </ol>
      </div>

      ${summaryHtml ? `
      <div class="section">
        <div class="muted">LLM Summary</div>
        <div class="card" style="margin-top:8px">
          ${summaryHtml}
        </div>
      </div>
      ` : ''}
    </div>
  </body>
  </html>
  `;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatSummaryHtml(summary: string): string {
  // Escape, then convert newlines to <br> and simple bullets
  const escaped = escapeHtml(summary);
  return escaped
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

async function summarizeWithNvidia(payload: any): Promise<string | null> {
  try {
    if (!process.env.NVIDIA_API_KEY) {
      console.warn("NVIDIA_API_KEY not set; skipping LLM summary");
      return null;
    }

    // Load system prompt from prompts/sys-prompt.md
    let systemPrompt = "";
    try {
      const promptPath = path.resolve(process.cwd(), "prompts", "sys-prompt.md");
      systemPrompt = await fs.readFile(promptPath, "utf8");
    } catch (e) {
      systemPrompt = "You are an expert engineering delivery advisor. Summarize concisely with actionable next steps.";
    }

    const model = process.env.NVIDIA_SUMMARY_MODEL || "meta/llama-3.1-70b-instruct";

    // Trim payload down a bit for the model
    const condensed = {
      repository: payload?.repository,
      latestSync: payload?.latestSync,
      health: payload?.health,
      actionQueue: payload?.actionQueue,
      developers: payload?.developers,
      errors: payload?.errors ? {
        total: payload.errors.total,
        topMessages: payload.errors.topMessages,
      } : null,
      chartsSummary: payload?.chartsSummary,
      benchmarks: payload?.benchmarks,
      distributions: payload?.distributions,
    };

    const instructions = [
      "You are writing the concluding executive summary for an engineering delivery report.",
      "Summarize current delivery health, cycle time, PR backlog, review responsiveness, and operational errors.",
      "Use crisp bullets, avoid fluff, prefer concrete numbers from the data.",
      "Limit to 120-180 words.",
      "End with 'Next 7 days focus:' and 2 short items.",
    ].join(" \n");

    const userContent = `${instructions}\n\nDATA (JSON):\n${JSON.stringify(condensed)}`;
    
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("NVIDIA API error:", res.status, errText);
      return null;
    }
    const json = await res.json();
    const completion = json?.choices?.[0]?.message?.content;
    if (typeof completion === "string" && completion.trim().length > 0) {
      return completion.trim();
    }
    const content = json?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      const joined = content
        .map((c: any) => (typeof c?.text === "string" ? c.text : ""))
        .filter(Boolean)
        .join("\n");
      return joined ? joined.trim() : null;
    }
    return null;
  } catch (e) {
    console.error("Failed to generate LLM summary:", e);
    return null;
  }
}

