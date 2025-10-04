# Developer Efficiency Metrics Guide

## Overview

This guide explains the metrics, visualizations, and insights available in Kaizen to help you understand and improve developer efficiency and team performance.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding Metrics](#understanding-metrics)
3. [Developer Efficiency Scores](#developer-efficiency-scores)
4. [Company Comparison](#company-comparison)
5. [Visualizations](#visualizations)
6. [Actionable Insights](#actionable-insights)

---

## Getting Started

### Running the Migration

First, apply the database migration to add multi-company support:

```bash
# If using Supabase CLI
supabase db push

# Or manually run the migration file
# Located at: supabase/migrations/20250104_add_multi_company_support.sql
```

### Syncing Data

#### Sync Supabase PRs (Your Team)
```bash
# Via API
curl -s "http://localhost:3000/api/sync-prs?state=all&perPage=100"
```

#### Sync Benchmark Companies (For Comparison)
```bash
# Via API - This will sync PRs from multiple companies
curl -X POST http://localhost:3000/api/sync-multi-repos \
  -H "Content-Type: application/json" \
  -d '{
    "perRepo": 100
  }'
```

This will fetch 100 PRs each from benchmark repositories like:
- Next.js (Vercel)
- React (Facebook)
- Vue.js
- Svelte
- Astro
- Nuxt
- Remix
- Solid

### Viewing Insights

Navigate to `/insights` to view the comprehensive dashboard with:
- Developer efficiency scores
- Team performance metrics
- Company comparisons
- Visualizations

---

## Understanding Metrics

### Raw Metrics (From Database Views)

#### Developer Metrics
- **Total PRs**: Number of pull requests created
- **Merged PRs**: PRs successfully merged
- **Open PRs**: Currently open PRs
- **Merge Rate**: Percentage of PRs that get merged
- **Avg Merge Hours**: Average time from PR creation to merge
- **Avg Time to First Review**: How quickly PRs get initial feedback
- **Total Changes**: Lines added + deleted across all PRs
- **Avg PR Size**: Average lines changed per PR
- **Small/Medium/Large PRs**: Distribution by size
  - Small: ≤200 lines
  - Medium: 201-1000 lines
  - Large: >1000 lines

#### Repository Metrics
- **Active Contributors**: Unique developers contributing
- **Total PRs**: All PRs in the repository
- **Median Merge Hours**: 50th percentile merge time
- **Avg Reviews per PR**: Average comments + review comments

---

## Developer Efficiency Scores

Each developer gets scored across 4 dimensions (0-100 scale):

### 1. Velocity Score (30% weight)
**What it measures**: Speed of delivery and PR throughput

**Components**:
- PRs per day (throughput)
- Average merge time (cycle time)

**Interpretation**:
- **80-100**: Excellent velocity - fast cycle times and high throughput
- **60-79**: Good velocity with room for improvement
- **40-59**: Moderate velocity - cycle times could be faster
- **0-39**: Low velocity - significant delays in PR cycle

**What managers should look for**:
- High velocity + high quality = top performer
- Low velocity + high quality = may need support or removing blockers
- High velocity + low quality = may be rushing, needs mentoring

### 2. Quality Score (35% weight)
**What it measures**: Work quality and PR scoping

**Components**:
- Merge rate (% of PRs that land)
- PR size distribution (smaller is better)
- Review engagement (comments/reviews received)

**Interpretation**:
- **80-100**: High quality - well-scoped PRs with good review engagement
- **60-79**: Good quality with some large or under-reviewed PRs
- **40-59**: Moderate quality - PRs may be too large or lack review
- **0-39**: Quality needs improvement - large PRs or low merge rate

**What managers should look for**:
- Small PRs (≤200 lines) typically indicate good practices
- High merge rate shows good judgment on PR scope
- Low review engagement may indicate isolated work

### 3. Collaboration Score (20% weight)
**What it measures**: Team engagement and code review participation

**Components**:
- Average engagement (comments + reviews on their PRs)

**Interpretation**:
- **80-100**: Highly collaborative - active in reviews and discussions
- **60-79**: Good collaboration with regular engagement
- **40-59**: Moderate collaboration - could engage more
- **0-39**: Limited collaboration - minimal review engagement

**What managers should look for**:
- Developers with low scores may be working in isolation
- High collaboration often correlates with knowledge sharing
- Balance is key - too much can indicate unclear requirements

### 4. Consistency Score (15% weight)
**What it measures**: Regularity and sustainability of contributions

**Components**:
- PRs per day (should be in 0.2-1.0 range for optimal score)

**Ideal**: 0.2-1.0 PRs per day = 1-5 PRs per week

**Interpretation**:
- **80-100**: Consistent contribution pattern - steady delivery
- **60-79**: Fairly consistent with some variation
- **40-59**: Inconsistent contribution pattern
- **0-39**: Very inconsistent - either too sparse or too intense

**What managers should look for**:
- Very low: Developer may be blocked or overwhelmed with other work
- Very high: Risk of burnout or poor work-life balance
- Erratic patterns: May indicate unclear priorities

### Overall Score
Weighted average of all four scores:
- Velocity: 30%
- Quality: 35%
- Collaboration: 20%
- Consistency: 15%

**Score Ranges**:
- **80-100**: Top performer - role model for the team
- **60-79**: Strong contributor - minor areas for improvement
- **40-59**: Solid contributor - needs targeted development
- **20-39**: Needs support - identify blockers and provide coaching
- **0-19**: Struggling - immediate intervention needed

---

## Company Comparison

### Metrics Compared

#### 1. Average Time to Merge
**What it means**: How quickly PRs go from creation to merge

**Industry benchmarks**:
- Top performers: <12 hours
- Industry median: 24-48 hours
- Needs improvement: >72 hours

**Why it matters**: Longer merge times mean:
- Slower feature delivery
- Increased context switching
- Higher risk of merge conflicts
- Delayed feedback loops

**How to improve**:
- Break down work into smaller PRs
- Establish dedicated review time
- Automate testing and checks
- Clear ownership and review assignments

#### 2. Average PR Size
**What it means**: Lines changed per PR (additions + deletions)

**Industry benchmarks**:
- Top performers: <200 lines
- Industry median: 200-500 lines
- Needs improvement: >500 lines

**Why it matters**: Smaller PRs are:
- Easier to review thoroughly
- Faster to merge
- Lower risk of bugs
- Better for code quality

**How to improve**:
- Break features into incremental changes
- Use feature flags for large changes
- Separate refactoring from feature work

#### 3. Merge Rate
**What it means**: Percentage of PRs that successfully merge

**Industry benchmarks**:
- Top performers: >85%
- Industry median: 75-85%
- Needs improvement: <75%

**Why it matters**: Low merge rate indicates:
- Poor scoping or planning
- Experimental work in PRs (should be in branches)
- Unclear requirements

**How to improve**:
- Better upfront planning
- Prototype in local branches first
- Clearer acceptance criteria

#### 4. Reviews per PR
**What it means**: Average comments and reviews per PR

**Industry benchmarks**:
- Strong review culture: >5 interactions
- Moderate: 2-5 interactions
- Needs improvement: <2 interactions

**Why it matters**: More reviews mean:
- Better knowledge sharing
- Higher code quality
- Stronger team cohesion

**How to improve**:
- Make code review a priority
- Rotate review assignments
- Recognize good reviewers

---

## Visualizations

### 1. PR Size vs Time to Merge (Scatter Plot)
**X-axis**: PR size (lines changed)
**Y-axis**: Time to merge (hours)

**What to look for**:
- **Ideal**: Cluster in bottom-left (small PRs, fast merge)
- **Warning**: Points in top-right (large PRs, slow merge)
- **Pattern**: Look for positive correlation (bigger = slower)

**Insights**:
- If small PRs take long: Review process bottleneck
- If large PRs merge fast: May indicate rubber-stamping

### 2. PR Size Distribution (Bar Chart)
Shows breakdown of Small/Medium/Large PRs

**Ideal distribution**:
- Small (≤200 lines): >60%
- Medium (201-1000): 30-35%
- Large (>1000): <10%

**What to look for**:
- Too many large PRs: Encourage breaking down work
- Only small PRs: Good, but check if artificially splitting related changes

### 3. Developer Radar Chart
Four dimensions: Velocity, Quality, Collaboration, Consistency

**Ideal shape**: Balanced pentagon/square (no extreme outliers)

**What to look for**:
- **One low dimension**: Focus area for development
- **All high**: Top performer
- **High velocity, low quality**: May be rushing
- **Low velocity, high quality**: May be blocked or over-thinking

### 4. Company Comparison (Bar Chart)
Your team vs industry median vs top performer

**What to look for**:
- Metrics where you lag significantly
- Your strengths vs industry
- Realistic improvement targets (aim for median first, then top 10%)

---

## Actionable Insights

### For Managers

#### High Performers (Score 80+)
- **Action**: Leverage them as mentors
- **Risk**: Burnout - monitor workload
- **Opportunity**: Technical leadership, architecture decisions

#### Solid Contributors (Score 60-79)
- **Action**: Identify 1-2 focus areas for improvement
- **Risk**: Stagnation - provide growth opportunities
- **Opportunity**: Pair with high performers for skill development

#### Need Support (Score 40-59)
- **Action**: Weekly 1:1s to identify blockers
- **Risk**: Falling further behind
- **Opportunity**: Targeted training or pairing

#### Struggling (Score <40)
- **Action**: Immediate intervention - daily check-ins
- **Risk**: Attrition or performance management
- **Opportunity**: May need role change or different team

### For Developers

#### If Your Velocity is Low:
- Break down work into smaller tasks
- Identify and escalate blockers
- Pair program to maintain momentum
- Set daily WIP limits

#### If Your Quality Score is Low:
- Aim for PRs under 200 lines
- Get early feedback (draft PRs)
- Add more tests before opening PR
- Review your own code first

#### If Your Collaboration Score is Low:
- Review 1-2 PRs daily
- Ask clarifying questions in reviews
- Engage in design discussions
- Respond promptly to review feedback

#### If Your Consistency Score is Low:
- Establish a regular work rhythm
- Use a task management system
- Break epics into daily-sized chunks
- Communicate blockers earlier

---

## Using the Dashboard

### Overview Tab
- See team-wide metrics at a glance
- Identify top performers
- View key scatter plots
- Check PR size distribution

### Developer Profiles Tab
- Select any developer
- View their radar chart
- See detailed score breakdowns
- Read personalized recommendations

### Company Comparison Tab
- Compare your team to industry
- See where you excel
- Identify improvement opportunities
- View benchmark repository stats

---

## FAQ

### Q: Why is merge time so important?
**A**: Faster merge time means faster feedback, less context switching, and quicker value delivery. It's the best proxy for delivery velocity.

### Q: Should all PRs be small?
**A**: Ideally, >60% should be small (≤200 lines). Some complex features naturally require larger PRs, but these should be the exception.

### Q: What if a developer has low scores across all dimensions?
**A**: This requires immediate attention. Common causes:
- Wrong role fit
- Inadequate onboarding
- Technical debt overwhelming them
- Personal issues affecting work
Schedule a 1:1 to understand root cause.

### Q: How often should I check these metrics?
**A**:
- **Weekly**: Quick overview check
- **Bi-weekly**: Deep dive on trends
- **Monthly**: Compare to previous month
- **Quarterly**: Strategic planning and goal setting

### Q: Are benchmark companies fair comparisons?
**A**: They provide directional guidance. Your team's context matters:
- Company stage (startup vs enterprise)
- Product complexity
- Team experience
- Technical debt

Use benchmarks as inspiration, not absolute targets.

---

## Next Steps

1. **Run the migration** to enable multi-company tracking
2. **Sync benchmark data** to get comparison insights
3. **Review the insights dashboard** weekly
4. **Identify 1-2 team-wide improvement areas**
5. **Have 1:1s** with outliers (both high and low performers)
6. **Track progress** month-over-month
7. **Celebrate improvements** publicly

---

## Support

For questions or issues:
- Check the main [README](./README.md)
- Review the [project plan](./project-plan.md)
- Open an issue on GitHub
