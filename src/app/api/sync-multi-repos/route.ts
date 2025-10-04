import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Multi-repository PR sync endpoint
 * Fetches PRs from multiple repositories for benchmarking and comparison
 */

interface Repository {
  owner: string;
  name: string;
  description?: string;
  companySize?: string;
  industry?: string;
  isBenchmark?: boolean;
}

// Benchmark repositories for comparison
const BENCHMARK_REPOS: Repository[] = [
  { owner: 'vercel', name: 'next.js', description: 'The React Framework', companySize: 'enterprise', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'facebook', name: 'react', description: 'A JavaScript library for building user interfaces', companySize: 'enterprise', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'vuejs', name: 'core', description: 'Vue.js framework', companySize: 'large', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'sveltejs', name: 'svelte', description: 'Cybernetically enhanced web apps', companySize: 'medium', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'withastro', name: 'astro', description: 'Build fast websites, faster', companySize: 'medium', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'nuxt', name: 'nuxt', description: 'The Intuitive Vue Framework', companySize: 'medium', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'remix-run', name: 'remix', description: 'Build Better Websites', companySize: 'medium', industry: 'Developer Tools', isBenchmark: true },
  { owner: 'solidjs', name: 'solid', description: 'A declarative JavaScript library', companySize: 'small', industry: 'Developer Tools', isBenchmark: true },
];

interface SyncResult {
  owner: string;
  name: string;
  total: number;
  new: number;
  updated: number;
  errors: number;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repos = body.repos || BENCHMARK_REPOS;
    const perRepo = body.perRepo || 100; // PRs to fetch per repository

    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { error: 'GitHub token not configured' },
        { status: 500 }
      );
    }

    const results: SyncResult[] = [];

    // Sync each repository
    for (const repo of repos) {
      console.log(`Syncing ${repo.owner}/${repo.name}...`);

      try {
        // First, upsert the repository metadata
        await supabase
          .from('repositories')
          .upsert({
            owner: repo.owner,
            name: repo.name,
            full_name: `${repo.owner}/${repo.name}`,
            description: repo.description || null,
            company_size: repo.companySize || null,
            industry: repo.industry || null,
            is_benchmark: repo.isBenchmark || false,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'owner,name',
          });

        // Fetch PRs from GitHub
        const prs = await fetchPRsForRepo(repo.owner, repo.name, perRepo, githubToken);

        let newCount = 0;
        let updatedCount = 0;
        let errorCount = 0;

        // Process each PR
        for (const pr of prs) {
          try {
            const prData = await transformPRData(pr, repo.owner, repo.name, githubToken);

            // Check if PR already exists
            const { data: existing } = await supabase
              .from('pull_requests')
              .select('id')
              .eq('repository_owner', repo.owner)
              .eq('repository_name', repo.name)
              .eq('pr_number', pr.number)
              .single();

            if (existing) {
              // Update existing PR
              const { error } = await supabase
                .from('pull_requests')
                .update(prData)
                .eq('repository_owner', repo.owner)
                .eq('repository_name', repo.name)
                .eq('pr_number', pr.number);

              if (error) {
                console.error(`Error updating PR #${pr.number}:`, error);
                errorCount++;
              } else {
                updatedCount++;
              }
            } else {
              // Insert new PR
              const { error } = await supabase
                .from('pull_requests')
                .insert(prData);

              if (error) {
                console.error(`Error inserting PR #${pr.number}:`, error);
                errorCount++;
              } else {
                newCount++;
              }
            }
          } catch (prError) {
            console.error(`Error processing PR #${pr.number}:`, prError);
            errorCount++;
          }
        }

        results.push({
          owner: repo.owner,
          name: repo.name,
          total: prs.length,
          new: newCount,
          updated: updatedCount,
          errors: errorCount,
          message: `Synced ${prs.length} PRs: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`,
        });

        console.log(`✓ Completed ${repo.owner}/${repo.name}: ${newCount} new, ${updatedCount} updated, ${errorCount} errors`);

      } catch (repoError) {
        console.error(`Error syncing ${repo.owner}/${repo.name}:`, repoError);
        results.push({
          owner: repo.owner,
          name: repo.name,
          total: 0,
          new: 0,
          updated: 0,
          errors: 1,
          message: `Failed to sync: ${repoError instanceof Error ? repoError.message : 'Unknown error'}`,
        });
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = {
      totalRepos: results.length,
      totalPRs: results.reduce((sum, r) => sum + r.total, 0),
      totalNew: results.reduce((sum, r) => sum + r.new, 0),
      totalUpdated: results.reduce((sum, r) => sum + r.updated, 0),
      totalErrors: results.reduce((sum, r) => sum + r.errors, 0),
    };

    return NextResponse.json({
      success: true,
      summary,
      results,
    });

  } catch (error) {
    console.error('Multi-repo sync error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}

async function fetchPRsForRepo(
  owner: string,
  name: string,
  count: number,
  token: string
): Promise<any[]> {
  const allPRs: any[] = [];
  let page = 1;
  const perPage = Math.min(100, count);

  while (allPRs.length < count) {
    const url = new URL(`https://api.github.com/repos/${owner}/${name}/pulls`);
    url.searchParams.set('state', 'all');
    url.searchParams.set('per_page', perPage.toString());
    url.searchParams.set('page', page.toString());
    url.searchParams.set('sort', 'updated');
    url.searchParams.set('direction', 'desc');

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const prs = await response.json();
    if (prs.length === 0) break;

    allPRs.push(...prs);
    if (prs.length < perPage || allPRs.length >= count) break;

    page++;
  }

  return allPRs.slice(0, count);
}

async function transformPRData(pr: any, owner: string, name: string, token: string) {
  // Fetch full PR details for size metrics
  const detailUrl = `https://api.github.com/repos/${owner}/${name}/pulls/${pr.number}`;
  const detailResponse = await fetch(detailUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!detailResponse.ok) {
    throw new Error(`Failed to fetch PR details: ${detailResponse.status}`);
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

  return {
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
    repository_owner: owner,
    repository_name: name,
    additions: prDetail.additions ?? null,
    deletions: prDetail.deletions ?? null,
    changed_files: prDetail.changed_files ?? null,
    commits_count: prDetail.commits ?? null,
    comments_count: prDetail.comments ?? 0,
    review_comments_count: prDetail.review_comments ?? 0,
    reviews_count: 0, // Would need separate API call
    is_merged: prDetail.merged_at !== null,
    mergeable_state: prDetail.mergeable_state || null,
    assignees: prDetail.assignees || [],
    time_to_first_review_hours: null, // Would need reviews API call
    time_to_merge_hours: timeToMergeHours,
    time_to_close_hours: timeToCloseHours,
    synced_at: new Date().toISOString(),
  };
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    // Get summary of synced repositories
    const { data: repos, error } = await supabase
      .from('repositories')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get PR counts per repository
    const { data: prCounts, error: countError } = await supabase
      .from('pull_requests')
      .select('repository_owner, repository_name')
      .order('repository_owner');

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Count PRs per repo
    const counts = prCounts?.reduce((acc: any, pr) => {
      const key = `${pr.repository_owner}/${pr.repository_name}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Combine data
    const reposWithCounts = repos?.map(repo => ({
      ...repo,
      pr_count: counts[`${repo.owner}/${repo.name}`] || 0,
    }));

    return NextResponse.json({
      success: true,
      repositories: reposWithCounts,
      totalRepositories: repos?.length || 0,
      totalPRs: prCounts?.length || 0,
      benchmarkRepos: BENCHMARK_REPOS,
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
