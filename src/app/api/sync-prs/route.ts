import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GitHub MCP is available in the environment, we'll need to use fetch or similar
// For now, we'll create a placeholder that can be called from the frontend
// The actual GitHub integration will need to be done via a server action or similar

interface PullRequest {
  id: string;
  pr_number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  author: string;
  author_avatar_url: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  html_url: string;
  draft: boolean;
  labels: any[];
  requested_reviewers: any[];
  requested_teams: any[];
  head_ref: string;
  base_ref: string;
  // Repository tracking
  repository_owner: string;
  repository_name: string;
  // PR size metrics
  additions: number | null;
  deletions: number | null;
  changed_files: number | null;
  commits_count: number | null;
  // Engagement metrics
  comments_count: number;
  review_comments_count: number;
  reviews_count: number;
  // Status fields
  is_merged: boolean;
  mergeable_state: string | null;
  assignees: any[];
  // Time-based metrics
  time_to_first_review_hours: number | null;
  time_to_merge_hours: number | null;
  time_to_close_hours: number | null;
  synced_at: string;
}

interface SyncStats {
  total: number;
  new: number;
  updated: number;
  errors: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state') || 'all';
    const perPage = parseInt(searchParams.get('perPage') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Validate parameters
    if (!['open', 'closed', 'all'].includes(state)) {
      return NextResponse.json(
        { error: 'Invalid state parameter. Must be: open, closed, or all' },
        { status: 400 }
      );
    }

    if (perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'perPage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Note: Since we're in a Next.js API route, we can't directly call MCP tools
    // We need to fetch from GitHub API directly
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    // Fetch PRs from GitHub API
    const url = new URL('https://api.github.com/repos/supabase/supabase/pulls');
    url.searchParams.set('state', state);
    url.searchParams.set('per_page', perPage.toString());
    url.searchParams.set('page', page.toString());
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('direction', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', errorText);
      return NextResponse.json(
        { error: `GitHub API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const prs = await response.json();

    // Transform and upsert PRs to database
    const stats: SyncStats = {
      total: prs.length,
      new: 0,
      updated: 0,
      errors: 0,
    };

    for (const pr of prs) {
      try {
        // Fetch full PR details to get size metrics and comment counts
        const detailUrl = `https://api.github.com/repos/supabase/supabase/pulls/${pr.number}`;
        const detailResponse = await fetch(detailUrl, {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        });

        if (!detailResponse.ok) {
          console.error(`Failed to fetch details for PR #${pr.number}`);
          stats.errors++;
          continue;
        }

        const prDetail = await detailResponse.json();

        // Calculate time-based metrics
        const createdAt = new Date(prDetail.created_at);
        const mergedAt = prDetail.merged_at ? new Date(prDetail.merged_at) : null;
        const closedAt = prDetail.closed_at ? new Date(prDetail.closed_at) : null;

        const timeToMergeHours = mergedAt
          ? (mergedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          : null;

        const timeToCloseHours = closedAt
          ? (closedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          : null;

        const prData: Omit<PullRequest, 'id'> = {
          pr_number: prDetail.number,
          title: prDetail.title,
          body: prDetail.body || null,
          state: prDetail.state,
          author: prDetail.user?.login || 'unknown',
          author_avatar_url: prDetail.user?.avatar_url || null,
          created_at: prDetail.created_at,
          updated_at: prDetail.updated_at,
          merged_at: prDetail.merged_at || null,
          closed_at: prDetail.closed_at || null,
          html_url: prDetail.html_url,
          draft: prDetail.draft || false,
          labels: prDetail.labels || [],
          requested_reviewers: prDetail.requested_reviewers || [],
          requested_teams: prDetail.requested_teams || [],
          head_ref: prDetail.head?.ref || 'unknown',
          base_ref: prDetail.base?.ref || 'unknown',
          // Repository tracking
          repository_owner: 'supabase',
          repository_name: 'supabase',
          // PR size metrics (now available from detail endpoint)
          additions: prDetail.additions ?? null,
          deletions: prDetail.deletions ?? null,
          changed_files: prDetail.changed_files ?? null,
          commits_count: prDetail.commits ?? null,
          // Engagement metrics (now available from detail endpoint)
          comments_count: prDetail.comments ?? 0,
          review_comments_count: prDetail.review_comments ?? 0,
          reviews_count: 0, // Still need to fetch reviews separately
          // Status fields
          is_merged: prDetail.merged_at !== null,
          mergeable_state: prDetail.mergeable_state || null,
          assignees: prDetail.assignees || [],
          // Time-based metrics
          time_to_first_review_hours: null, // Will need to fetch review data separately
          time_to_merge_hours: timeToMergeHours,
          time_to_close_hours: timeToCloseHours,
          synced_at: new Date().toISOString(),
        };

        // Check if PR already exists
        const { data: existing } = await supabase
          .from('pull_requests')
          .select('id')
          .eq('pr_number', pr.number)
          .single();

        if (existing) {
          // Update existing PR
          const { error } = await supabase
            .from('pull_requests')
            .update(prData)
            .eq('pr_number', pr.number);

          if (error) {
            console.error(`Error updating PR #${pr.number}:`, error);
            stats.errors++;
          } else {
            stats.updated++;
          }
        } else {
          // Insert new PR
          const { error } = await supabase
            .from('pull_requests')
            .insert(prData);

          if (error) {
            console.error(`Error inserting PR #${pr.number}:`, error);
            console.error('Full error details:', JSON.stringify(error, null, 2));
            stats.errors++;
          } else {
            stats.new++;
          }
        }
      } catch (error) {
        console.error(`Error processing PR #${pr.number}:`, error);
        stats.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      message: `Synced ${stats.total} PRs: ${stats.new} new, ${stats.updated} updated, ${stats.errors} errors`,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
