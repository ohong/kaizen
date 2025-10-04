# Repository Filtering Fix

## Problem Solved

**Before**: The main dashboard showed ALL PRs from ALL companies mixed together (~1000 PRs), making it impossible to focus on your team (Supabase).

**After**: Clean separation between your team's data and benchmark data.

---

## How It Works Now

### Main Dashboard (`/`)

**Purpose**: Manage YOUR team's PRs and contributors

**Default View**:
- Shows ONLY Supabase PRs
- Shows ONLY Supabase contributors
- Clear indicator: "Viewing: supabase/supabase"

**Repository Selector**:
- Click the dropdown to switch companies
- See Supabase marked as "Your Team"
- View other companies individually (for curiosity)
- Each company shows: PR count, contributor count

**URL Persistence**:
- Current repository is saved in URL: `/?repo=supabase/supabase`
- Share URLs to specific repositories
- Browser back/forward works correctly

---

### Insights Dashboard (`/insights`)

**Purpose**: Compare YOUR team to industry benchmarks

**Data Sources**:
- **Your Team Data**: ONLY Supabase PRs and developers
- **Benchmark Data**: 8 other companies (React, Next.js, Vue, etc.)
- **Comparison**: Your metrics vs their metrics

**Visual Indicators**:
- Purple "Supabase Team" badge in header
- Description: "compared to industry benchmarks from X companies"
- All scatter plots and charts use ONLY Supabase data
- Comparison charts show "Your Team" vs "Industry Median"

**Three Tabs**:
1. **Overview**: Your team metrics, scatter plots, top performers (all Supabase)
2. **Developer Profiles**: Supabase developers only with efficiency scores
3. **Company Comparison**: Supabase vs benchmark companies

---

## Implementation Details

### Files Changed

1. **`src/lib/repository-utils.ts`** (NEW)
   - Repository selection helpers
   - URL parsing and building
   - Default repository constant
   - Get available repositories from database

2. **`src/app/page.tsx`** (UPDATED)
   - Added repository state and URL sync
   - Filter PRs by `repository_owner` and `repository_name`
   - Added `RepositorySelector` dropdown component
   - Show current repository in header

3. **`src/app/insights/page.tsx`** (UPDATED)
   - Hard-coded Supabase filtering
   - Load ONLY Supabase PRs: `.eq("repository_owner", "supabase").eq("repository_name", "supabase")`
   - Load ONLY Supabase developer metrics with same filter
   - Exclude Supabase from benchmark repos
   - Added "Supabase Team" badge to header

---

## Database Queries

### Main Dashboard
```typescript
// Before (showed ALL 1000 PRs)
.from("pull_requests")
.select("*")

// After (shows ONLY Supabase PRs)
.from("pull_requests")
.select("*")
.eq("repository_owner", selectedRepository.owner)
.eq("repository_name", selectedRepository.name)
```

### Insights Dashboard
```typescript
// PRs - ONLY Supabase
.from("pull_requests")
.select("*")
.eq("repository_owner", "supabase")
.eq("repository_name", "supabase")

// Developer metrics - ONLY Supabase
.from("developer_metrics")
.select("*")
.eq("repository_owner", "supabase")
.eq("repository_name", "supabase")

// Repository metrics - ALL (for comparison)
.from("repository_metrics")
.select("*")

// Then in code:
const yourRepo = repos.find(r =>
  r.repository_owner === "supabase" &&
  r.repository_name === "supabase"
);

const benchmarkRepos = repos.filter(r =>
  !(r.repository_owner === "supabase" && r.repository_name === "supabase")
);
```

---

## User Experience

### Scenario 1: Manager Checking Team PRs

1. Navigate to `/` (main dashboard)
2. See ONLY Supabase PRs (not 1000)
3. See ONLY Supabase contributors
4. Review recent PRs and contributor activity
5. Click "View Insights →" for deeper analysis

### Scenario 2: Manager Comparing to Industry

1. Navigate to `/insights`
2. See "Supabase Team" badge (confirmation)
3. **Overview tab**: Your team's metrics and patterns
4. **Comparison tab**: See how Supabase compares to React, Next.js, etc.
5. Get specific recommendations based on gaps

### Scenario 3: Curiosity About Other Companies

1. On main dashboard, click repository selector dropdown
2. See list: Supabase (Your Team), react, next.js, vue, etc.
3. Select "facebook/react"
4. View React's PRs and contributors
5. Switch back to "supabase/supabase" anytime

---

## Verification Steps

### Test 1: Main Dashboard Shows Only Supabase

1. Navigate to `http://localhost:3000`
2. Check PR count (should be ~100, not 1000)
3. Look for "Viewing: supabase/supabase" indicator
4. Verify contributor list shows only Supabase devs

### Test 2: Repository Selector Works

1. Click the repository dropdown
2. See "supabase/supabase" marked as "Your Team"
3. Select another company (e.g., "facebook/react")
4. URL changes to `/?repo=facebook/react`
5. PRs and contributors update to show React data
6. Switch back to Supabase

### Test 3: Insights Shows Only Supabase

1. Navigate to `http://localhost:3000/insights`
2. Check for "Supabase Team" purple badge
3. Overview tab: Verify PR counts match Supabase only
4. Developer Profiles tab: Only Supabase developers listed
5. Comparison tab: "Your Team" should be Supabase metrics

### Test 4: Scatter Plots Use Correct Data

1. Go to insights Overview tab
2. Scatter plot "PR Size vs Time to Merge"
3. Hover over points - should show Supabase authors only
4. PR count should match your Supabase PR count (~100)

---

## Common Questions

**Q: Can I still see benchmark company data?**
A: Yes! On the main dashboard, use the repository selector to switch to any company. On insights, the comparison tab shows all benchmark companies.

**Q: Where's the data for React, Next.js, etc.?**
A: It's in the database, used for comparisons. On the main dashboard, select them from the dropdown. On insights, they appear in the Comparison tab.

**Q: Why is Supabase the default?**
A: It's your company, so it's the primary focus. The system treats Supabase as "your team" and others as "benchmarks".

**Q: Can I add more companies?**
A: Yes! Run the sync endpoint with additional repos:
```bash
curl -X POST http://localhost:3000/api/sync-multi-repos \
  -H "Content-Type: application/json" \
  -d '{
    "repos": [
      {"owner": "microsoft", "name": "vscode", "isBenchmark": true}
    ],
    "perRepo": 100
  }'
```

**Q: Can I change which company is "my team"?**
A: Currently, "Supabase" is hard-coded in insights. To change it:
1. Edit `src/app/insights/page.tsx`
2. Replace `"supabase"` with your company name in the filter queries
3. Update the "Supabase Team" badge text

---

## Benefits

✅ **No more confusion** - Clear separation of your team vs benchmarks
✅ **Faster loading** - Querying 100 PRs instead of 1000
✅ **Better focus** - See only what matters for day-to-day work
✅ **Easy comparison** - Switch between companies or view in insights
✅ **URL sharing** - Share specific repository views with team
✅ **Clear indicators** - Always know what you're viewing

---

## Technical Notes

### Why Filter at Query Level?

Instead of loading all PRs and filtering in JavaScript, we filter at the database level:

**Advantages**:
- Faster queries (index on repository columns)
- Less data transferred
- Lower memory usage
- Better performance with large datasets

**Implementation**:
```typescript
// Efficient - filters in database
.eq("repository_owner", "supabase")
.eq("repository_name", "supabase")

// Inefficient - would load all then filter
.select("*")
// then: prs.filter(pr => pr.repository_owner === "supabase")
```

### Indexes Added

Migration added these indexes for fast filtering:
```sql
CREATE INDEX idx_pull_requests_repo
ON pull_requests(repository_owner, repository_name);

CREATE INDEX idx_pull_requests_author
ON pull_requests(author);
```

---

**Status**: ✅ Complete
**Tested**: Yes
**Ready for use**: Yes
