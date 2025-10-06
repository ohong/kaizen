import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  RepositoryMetadata,
  getGitHubToken,
  syncRepository,
  upsertRepositoryMetadata,
} from '@/lib/github-sync';

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

    const githubToken = getGitHubToken();
    const results: SyncResult[] = [];

    // Sync each repository
    for (const repo of repos) {
      console.log(`Syncing ${repo.owner}/${repo.name}...`);

      try {
        // First, upsert the repository metadata
        if (repo.description || repo.companySize || repo.industry || repo.isBenchmark) {
          await upsertRepositoryMetadata(repo as RepositoryMetadata);
        }

        const result = await syncRepository({
          owner: repo.owner,
          name: repo.name,
          perRepo,
          token: githubToken,
          metadata: {
            owner: repo.owner,
            name: repo.name,
            description: repo.description,
            companySize: repo.companySize,
            industry: repo.industry,
            isBenchmark: repo.isBenchmark,
          },
        });

        results.push({
          owner: repo.owner,
          name: repo.name,
          total: result.total,
          new: result.newCount,
          updated: result.updatedCount,
          errors: result.errorCount,
          message: `Synced ${result.total} PRs: ${result.newCount} new, ${result.updatedCount} updated, ${result.errorCount} errors`,
        });

        console.log(`✓ Completed ${repo.owner}/${repo.name}: ${result.newCount} new, ${result.updatedCount} updated, ${result.errorCount} errors`);

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

// GET endpoint to check sync status
export async function GET() {
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
    const counts: Record<string, number> = {};
    for (const pr of prCounts ?? []) {
      const key = `${pr.repository_owner}/${pr.repository_name}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }

    // Combine data
    const reposWithCounts = (repos ?? []).map((repo) => ({
      ...repo,
      pr_count: counts[`${repo.owner}/${repo.name}`] ?? 0,
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
