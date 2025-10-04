-- Migration: Add multi-company support and efficiency metrics
-- Created: 2025-10-04

-- Add repository tracking columns to pull_requests table
ALTER TABLE pull_requests
ADD COLUMN IF NOT EXISTS repository_owner TEXT NOT NULL DEFAULT 'supabase',
ADD COLUMN IF NOT EXISTS repository_name TEXT NOT NULL DEFAULT 'supabase';

-- Create index for faster queries by repository
CREATE INDEX IF NOT EXISTS idx_pull_requests_repo
ON pull_requests(repository_owner, repository_name);

-- Create index for author queries
CREATE INDEX IF NOT EXISTS idx_pull_requests_author
ON pull_requests(author);

-- Create repositories table for metadata
CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  stars INTEGER,
  company_size TEXT, -- small, medium, large, enterprise
  industry TEXT,
  is_benchmark BOOLEAN DEFAULT false, -- whether to use for comparisons
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner, name)
);

-- Create index for benchmark repositories
CREATE INDEX IF NOT EXISTS idx_repositories_benchmark
ON repositories(is_benchmark)
WHERE is_benchmark = true;

-- Insert Supabase as the first repository
INSERT INTO repositories (owner, name, full_name, description, company_size, industry, is_benchmark)
VALUES ('supabase', 'supabase', 'supabase/supabase', 'The open source Firebase alternative', 'enterprise', 'Developer Tools', false)
ON CONFLICT (owner, name) DO NOTHING;

-- Create view for developer efficiency metrics
CREATE OR REPLACE VIEW developer_metrics AS
SELECT
  pr.author,
  pr.repository_owner,
  pr.repository_name,
  COUNT(*) as total_prs,
  COUNT(*) FILTER (WHERE pr.is_merged) as merged_prs,
  COUNT(*) FILTER (WHERE pr.state = 'open') as open_prs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE pr.is_merged) / NULLIF(COUNT(*), 0), 2) as merge_rate_percent,
  AVG(pr.time_to_merge_hours) FILTER (WHERE pr.is_merged) as avg_merge_hours,
  AVG(pr.time_to_first_review_hours) as avg_time_to_first_review_hours,
  SUM(pr.additions) as total_additions,
  SUM(pr.deletions) as total_deletions,
  SUM(pr.additions + pr.deletions) as total_changes,
  AVG(pr.additions + pr.deletions) as avg_pr_size,
  AVG(pr.comments_count + pr.review_comments_count) as avg_engagement,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) <= 200) as small_prs,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) > 200 AND (pr.additions + pr.deletions) <= 1000) as medium_prs,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) > 1000) as large_prs,
  MAX(pr.updated_at) as last_activity,
  EXTRACT(EPOCH FROM (MAX(pr.updated_at) - MIN(pr.created_at))) / 86400.0 as activity_span_days
FROM pull_requests pr
GROUP BY pr.author, pr.repository_owner, pr.repository_name;

-- Create view for company/repository metrics
CREATE OR REPLACE VIEW repository_metrics AS
SELECT
  pr.repository_owner,
  pr.repository_name,
  COUNT(DISTINCT pr.author) as active_contributors,
  COUNT(*) as total_prs,
  COUNT(*) FILTER (WHERE pr.is_merged) as merged_prs,
  COUNT(*) FILTER (WHERE pr.state = 'open') as open_prs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE pr.is_merged) / NULLIF(COUNT(*), 0), 2) as merge_rate_percent,
  AVG(pr.time_to_merge_hours) FILTER (WHERE pr.is_merged) as avg_merge_hours,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY pr.time_to_merge_hours) FILTER (WHERE pr.is_merged) as median_merge_hours,
  AVG(pr.time_to_first_review_hours) as avg_time_to_first_review_hours,
  AVG(pr.comments_count + pr.review_comments_count) as avg_reviews_per_pr,
  AVG(pr.additions + pr.deletions) as avg_pr_size,
  SUM(pr.additions + pr.deletions) as total_changes,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) <= 200) as small_prs,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) > 200 AND (pr.additions + pr.deletions) <= 1000) as medium_prs,
  COUNT(*) FILTER (WHERE (pr.additions + pr.deletions) > 1000) as large_prs,
  MIN(pr.created_at) as first_pr_date,
  MAX(pr.updated_at) as last_pr_date,
  EXTRACT(EPOCH FROM (MAX(pr.updated_at) - MIN(pr.created_at))) / 86400.0 as data_span_days
FROM pull_requests pr
GROUP BY pr.repository_owner, pr.repository_name;

-- Add comment explaining the schema
COMMENT ON TABLE repositories IS 'Stores metadata about tracked repositories for benchmarking and comparison';
COMMENT ON TABLE pull_requests IS 'Stores pull request data from GitHub for analysis';
COMMENT ON VIEW developer_metrics IS 'Aggregated efficiency metrics per developer per repository';
COMMENT ON VIEW repository_metrics IS 'Aggregated efficiency metrics per repository for company comparison';
