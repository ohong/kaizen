# Project Plan: Kaizen - Developer Impact Analytics

## Product Overview
A hackathon-scoped tool that analyzes the [Supabase open source repository](https://github.com/supabase/supabase) to visualize individual contributor impact across 9 key engineering dimensions. Each developer gets a radar chart showing their contribution profile.

**Critical Constraint:** Designed for contribution analysis in open source contexts, not employee performance evaluation.

---

## The 9 Developer Dimensions

1. **Code Velocity** - Lines of code changed per week (GitHub commits)
2. **Review Quality** - PR review comments given / PRs reviewed (GitHub)
3. **Code Stability** - Inverse of bug-related commits in their code (GitHub issues linked to commits)
4. **Collaboration** - Number of unique collaborators on PRs (GitHub)
5. **Incident Response** - Speed of fixing production issues (Datadog alerts → GitHub commits)
6. **Feature Delivery** - Linear tickets moved to "Done" (Linear API)
7. **Documentation** - Commits to `.md` files / total commits (GitHub)
8. **Testing Rigor** - Test file changes / total code changes (GitHub)
9. **Availability** - Commit frequency (commits per active day) (GitHub)

---

## Data Sources

### GitHub API
- Repository: `supabase/supabase`
- Pull: commits, PRs, reviews, file changes, contributors
- Time window: Last 90 days

### Linear API  
- Pull: tickets assigned to GitHub usernames
- Filter: Status = "Done" 
- Time window: Last 90 days

### Datadog API
- Pull: Incident alerts with assigned owner
- Match: Owner email → GitHub username
- Metric: Time from alert → fix commit

---

## Database Schema (Supabase Postgres)

```sql
-- contributors table
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- metrics_snapshot table
CREATE TABLE metrics_snapshot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contributor_id UUID REFERENCES contributors(id),
  dimension TEXT NOT NULL, -- e.g., 'code_velocity'
  score FLOAT NOT NULL, -- normalized 0-100
  raw_value JSONB, -- store raw data for debugging
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_reports table
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_date DATE NOT NULL,
  top_contributors JSONB, -- array of top 5
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints

### `POST /api/sync`
Triggers data sync from GitHub, Linear, Datadog
- Fetches last 90 days of activity
- Calculates scores for all 9 dimensions
- Stores in `metrics_snapshot` table
- Returns: `{ synced_contributors: 45, timestamp: "..." }`

### `GET /api/contributors`
Returns list of all contributors with latest scores
- Response: Array of contributor objects with dimension scores

### `GET /api/contributors/:username`
Returns detailed radar chart data for one contributor
- Response: 
```json
{
  "username": "kiwicopple",
  "avatar_url": "...",
  "dimensions": {
    "code_velocity": 78,
    "review_quality": 92,
    ...
  },
  "rank": 3,
  "total_contributors": 45
}
```

### `POST /api/reports/send`
Generates and sends daily report via Resend
- Identifies top 5 contributors by composite score
- Sends email to configured recipient
- Returns: `{ sent: true, recipients: [...] }`

---

## Frontend Requirements

### Dashboard View (`/`)
- Table showing all contributors
- Columns: Avatar, Username, Top Dimension, Composite Score, Rank
- Sortable by any dimension
- Click row → navigate to detail page

### Contributor Detail View (`/contributor/:username`)
- Radar chart (9 axes, one per dimension)
- Use Chart.js or Recharts
- Show raw values on hover
- Display rank: "Top 5% of contributors"
- List of recent notable contributions (5 items)

### Minimal Styling
- Use Tailwind CSS
- Responsive (mobile-friendly table)
- Dark mode optional (skip if time-constrained)

---

## Email Reports (Resend)

### Daily Digest Template
**Subject:** `Supabase DevRadar - Top Contributors (Dec 4, 2025)`

**Body:**
```
Top 5 Contributors This Week:

1. @kiwicopple - Composite Score: 89/100
   Strengths: Review Quality (95), Collaboration (91)
   
2. @thorwebdev - Composite Score: 86/100
   Strengths: Code Velocity (93), Feature Delivery (88)

[...repeat for top 5...]

View full dashboard: https://devradar.vercel.app
```

**Send to:** Configured email (hardcode for hackathon)

---

## Calculation Logic

### Dimension Scoring (normalize to 0-100)
Each dimension gets scored using percentile ranking:
- Fetch raw values for all contributors
- Sort by raw value
- Assign percentile (contributor's position / total contributors * 100)
- Store both raw value and percentile score

### Composite Score
Simple average of all 9 dimension scores:
```
composite_score = (sum of all 9 dimension scores) / 9
```

### Example Calculation (Code Velocity)
```python
# Raw data: contributor commits per week
contributor_commits = {
  "kiwicopple": 42,
  "thorwebdev": 38,
  "user3": 25,
  ...
}

# Sort and percentile rank
sorted_values = sorted(contributor_commits.values())
kiwicopple_percentile = (rank of 42 in sorted_values) / total * 100
# If 42 is top value → 100th percentile → score = 100
```

---

## 5-Hour Build Plan

### Hour 1: Setup & Data Ingestion
**Person 1:** 
- Initialize Next.js project with Tailwind
- Set up Supabase project + run schema migrations
- Create `.env` with API keys (GitHub, Linear, Datadog, Resend)

**Person 2:**
- Write GitHub API client (fetch commits, PRs, reviews from supabase/supabase)
- Implement basic rate limiting

**Person 3:**
- Write Linear API client (fetch completed tickets)
- Write Datadog API client (fetch incidents)

### Hour 2: Scoring Engine
**Person 1:**
- Build `/api/sync` endpoint
- Implement percentile ranking algorithm
- Store scores in Supabase

**Person 2:**
- Implement dimension calculations 1-5:
  - Code Velocity (commits/week)
  - Review Quality (reviews given)
  - Code Stability (bug commits)
  - Collaboration (unique PR collaborators)
  - Incident Response (Datadog → GitHub)

**Person 3:**
- Implement dimension calculations 6-9:
  - Feature Delivery (Linear tickets)
  - Documentation (`.md` commits)
  - Testing Rigor (test file changes)
  - Availability (commit frequency)

### Hour 3: API & Dashboard
**Person 1:**
- Build `/api/contributors` and `/api/contributors/:username` endpoints
- Test with Postman/curl

**Person 2:**
- Build dashboard table view (list all contributors)
- Add sorting functionality

**Person 3:**
- Build contributor detail page
- Integrate Chart.js radar chart

### Hour 4: Email Reports
**Person 1:**
- Build `/api/reports/send` endpoint
- Integrate Resend API
- Create email template

**Person 2:**
- Add "Send Report" button to dashboard
- Polish table UI (add avatars, badges)

**Person 3:**
- Add loading states
- Handle error cases (API failures)

### Hour 5: Polish & Demo Prep
**All:**
- Run full sync on supabase/supabase repo
- Test email delivery
- Verify radar charts render correctly
- Prepare demo script:
  1. Show dashboard with 40+ contributors
  2. Click top contributor → show radar chart
  3. Trigger email send → show inbox
  4. Explain 9 dimensions briefly

---

## Technical Constraints

### GitHub API Rate Limits
- 5,000 requests/hour (authenticated)
- Cache aggressively
- Only sync once per demo

### Linear API
- Requires API key with read scope
- Match Linear users to GitHub usernames via email

### Datadog API
- May not have incident data for OSS repo
- **Fallback:** Generate mock incident data for demo

### Supabase Repo Size
- ~45 active contributors in last 90 days
- ~2,000 commits in last 90 days
- Manageable dataset for hackathon

---

## Out of Scope (Don't Build)

- User authentication (single hardcoded user)
- Historical trend charts (only current snapshot)
- Team-level aggregations
- Customizable dimension weights
- Export to CSV
- Mobile app

---

## Success Criteria

**Must Have:**
✅ Sync supabase/supabase repo data  
✅ Calculate 9 dimension scores  
✅ Display radar chart for any contributor  
✅ Send email via Resend with top 5 contributors  

**Nice to Have:**
- Rank badges ("Top 10%")
- Hover tooltips explaining each dimension
- Dark mode

---

## Key Files for AI Agents

```
/
├── app/
│   ├── page.tsx              # Dashboard table
│   ├── contributor/
│   │   └── [username]/
│   │       └── page.tsx      # Radar chart detail view
│   └── api/
│       ├── sync/route.ts     # Data ingestion endpoint
│       ├── contributors/route.ts
│       └── reports/
│           └── send/route.ts # Email sending
├── lib/
│   ├── github.ts             # GitHub API client
│   ├── linear.ts             # Linear API client  
│   ├── datadog.ts            # Datadog API client
│   ├── scoring.ts            # Percentile calculation logic
│   └── supabase.ts           # DB client
└── .env.local
    GITHUB_TOKEN=
    LINEAR_API_KEY=
    DATADOG_API_KEY=
    RESEND_API_KEY=
    NEXT_PUBLIC_SUPABASE_URL=
    SUPABASE_SERVICE_ROLE_KEY=
```

---

## Sample Output

**Dashboard Table:**
| Rank | Contributor | Top Strength | Composite Score |
|------|-------------|--------------|-----------------|
| 1 | @kiwicopple | Review Quality (95) | 89 |
| 2 | @thorwebdev | Code Velocity (93) | 86 |
| 3 | @saltcod | Documentation (91) | 82 |

**Radar Chart for @kiwicopple:**
```
      Code Velocity (78)
             |
Testing ------●------ Review Quality (95)
             |
    Collaboration (91)
```

This spec is executable by AI coding agents with clear inputs/outputs for each component.