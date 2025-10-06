import { NextResponse } from "next/server";

interface OverviewRequest {
  repository: { owner: string; name: string };
  wins: string[];
  focusAreas: string[];
  actionQueue: Array<{
    title: string;
    description: string;
    prCount: number;
    samplePRs: Array<{ title: string; author?: string | null; updatedAt?: string | null }>;
  }>;
}

interface AnthropicMessageContent {
  type?: string;
  text?: string;
  [key: string]: unknown;
}

const MAX_ITEM_LENGTH = 140;
const MAX_ITEMS = 3;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OverviewRequest;
    const fallback = buildFallback(body);

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(fallback);
    }

    const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";
    const instructions = [
      "You are preparing an executive dashboard overview for an engineering leader using Kaizen.",
      "Return JSON with two arrays: working (top strengths) and to_work_on (top risks).",
      "Each array must contain at most 3 bullets; each bullet must be <= 140 characters.",
      "Focus on actionable, specific insights grounded in the provided data.",
      "Do not include numbering, emojis, or markdown—plain sentences only.",
    ].join(" \n");

    const userContext = {
      repository: body.repository,
      wins: body.wins,
      focus_areas: body.focusAreas,
      action_queue: body.actionQueue,
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 400,
        temperature: 0.2,
        system: instructions,
        messages: [
          {
            role: "user",
            content: `Data: ${JSON.stringify(userContext)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic overview error:", res.status, errText);
      return NextResponse.json(fallback, { status: 200 });
    }

    const json = await res.json();
    const content = Array.isArray(json?.content)
      ? (json.content as AnthropicMessageContent[])
      : [];
    const firstText = content.find((c) => typeof c.text === "string")?.text;
    if (!firstText) {
      return NextResponse.json(fallback);
    }

    let parsed: { working?: string[]; to_work_on?: string[] } | null = null;
    try {
      const start = firstText.indexOf("{");
      const end = firstText.lastIndexOf("}");
      if (start >= 0 && end > start) {
        parsed = JSON.parse(firstText.slice(start, end + 1));
      } else {
        parsed = JSON.parse(firstText);
      }
    } catch (parseError) {
      console.error("Failed to parse overview JSON:", parseError);
      return NextResponse.json(fallback);
    }

    const working = sanitiseList(parsed?.working ?? fallback.working);
    const toWorkOn = sanitiseList(parsed?.to_work_on ?? fallback.toWorkOn);

    return NextResponse.json({ working, toWorkOn });
  } catch (error) {
    console.error("Overview route error:", error);
    return NextResponse.json(
      { working: [], toWorkOn: [], error: "Failed to generate overview" },
      { status: 500 }
    );
  }
}

function buildFallback(body: OverviewRequest) {
  const workingSeed = body.wins?.slice(0, MAX_ITEMS) ?? [];
  const toWorkSeed = body.focusAreas?.slice(0, MAX_ITEMS) ?? [];

  if (toWorkSeed.length < MAX_ITEMS && body.actionQueue?.length) {
    for (const group of body.actionQueue) {
      if (toWorkSeed.length >= MAX_ITEMS) break;
      toWorkSeed.push(`${group.title}: ${group.description}`);
    }
  }

  return {
    working: sanitiseList(workingSeed),
    toWorkOn: sanitiseList(toWorkSeed),
  };
}

function sanitiseList(values: string[]) {
  return values
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .slice(0, MAX_ITEMS)
    .map((item) => truncate(item.trim(), MAX_ITEM_LENGTH));
}

function truncate(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}
