# Kaizen
Kaizen use AI to analyse developer impact and offer an actionable theory of improvement. [Demo video.](https://www.loom.com/share/2616eeba1ae842a4b47d912505e43bed?sid=96108167-f381-49a5-8e41-3a8a4537f338)

## What is Kaizen?

Kaizen helps engineering leaders at small to medium-sized companies understand team productivity, evaluate AI adoption impact, and get specific recommendations for improvement. Unlike traditional dashboards that show metrics without context, Kaizen uses AI to provide a "theory of improvement"—telling you not just what's happening, but what to do about it.

## Who is this for?

Engineering leaders at companies with fewer than 500 engineers who want to:
- Identify high-impact contributors and emerging talent
- Understand where their team stands relative to industry benchmarks
- Measure the productivity impact of AI tools (similar to METR's methodology)
- Get actionable recommendations instead of just dashboards

## Core Features

### Individual Developer Profiles
Each contributor gets a radar chart across 9 dimensions:
- **Code Velocity** - Commit frequency and volume
- **Review Quality** - PR review depth and engagement
- **Code Stability** - Bug rate in contributed code
- **Collaboration** - Cross-team work patterns
- **Incident Response** - Production issue resolution speed
- **Feature Delivery** - Completed tickets and shipped work
- **Documentation** - Knowledge sharing contributions
- **Testing Rigor** - Test coverage improvements
- **Availability** - Consistent contribution patterns

### AI-Powered Insights
The system analyzes your metrics and generates:
- **Diagnosis** - Where your team underperforms relative to benchmarks
- **Theory of Improvement** - Research-backed practices that correlate with better outcomes
- **Recommended Projects** - Specific initiatives ranked by expected impact

Example: "Your deployment frequency is 2x/week vs. industry median of 8x/week. Teams that improved this metric typically adopted trunk-based development and automated testing. Priority: Implement CI/CD for your 3 highest-traffic services."

### AI Impact Measurement
Track productivity changes after AI tool adoption:
- Before/after metric comparison
- Individual variation in AI effectiveness
- ROI analysis on AI tooling investments

## Data Sources

Kaizen integrates with:
- **GitHub** - Code commits, PRs, reviews, file changes
- **Linear** - Ticket completion and feature delivery
- **Datadog** - Incident response, deployment frequency, error rates

## How It Works

1. **Connect** - Authenticate with GitHub, Linear, and Datadog
2. **Sync** - Pull 90 days of historical data
3. **Analyze** - AI calculates dimension scores and identifies patterns
4. **Review** - View team dashboard and individual radar charts
5. **Act** - Receive weekly recommendations via email

## Key Differentiators

**Actionable vs. Observational** - Most tools show you lines on a graph. Kaizen tells you which projects to prioritize.

**Individual + Team** - Understand both aggregate team health and individual contribution patterns.

**Research-Grounded** - Synthesizes DORA, SPACE, and Accelerate research into specific recommendations for your context.

**AI-Native** - Built for the era where AI tools are part of every developer's workflow.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Add API keys for GitHub, Linear, Datadog, Resend, Supabase
npm run dev
```

Visit `http://localhost:3000` and trigger your first sync.

---

**Note:** This tool is designed for team improvement, not individual performance evaluation. Use responsibly.
