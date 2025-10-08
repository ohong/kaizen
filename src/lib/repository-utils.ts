import { supabase } from './supabase';

/**
 * Repository utilities for filtering and selecting repositories
 */

export const DEFAULT_REPO = {
  owner: 'supabase',
  name: 'supabase',
  fullName: 'supabase/supabase',
};

export interface RepositoryOption {
  owner: string;
  name: string;
  fullName: string;
  description?: string;
  prCount?: number;
  contributorCount?: number;
  isBenchmark: boolean;
}

/**
 * Get all available repositories with PR counts
 */
export async function getAvailableRepositories(): Promise<RepositoryOption[]> {
  try {
    // Get repositories from DB
    const { data: repos, error: repoError } = await supabase
      .from('repositories')
      .select('*')
      .order('owner', { ascending: true }) as { data: { owner: string; name: string; description: string | null; is_benchmark: boolean }[] | null; error: Error | null };

    if (repoError) throw repoError;

    // Get PR counts per repository
    const { data: prCounts, error: countError } = await supabase
      .from('pull_requests')
      .select('repository_owner, repository_name')
      .order('repository_owner') as { data: { repository_owner: string; repository_name: string }[] | null; error: Error | null };

    if (countError) throw countError;

    // Count PRs and contributors per repo
    const repoStats = (prCounts ?? [] as { repository_owner: string; repository_name: string }[]).reduce<Record<string, { prCount: number }>>((acc, pr) => {
      const key = `${pr.repository_owner}/${pr.repository_name}`;
      if (!acc[key]) {
        acc[key] = { prCount: 0 };
      }
      acc[key].prCount += 1;
      return acc;
    }, {});

    // Get contributor counts
    const { data: devMetrics } = await supabase
      .from('developer_metrics')
      .select('repository_owner, repository_name, author') as { data: { repository_owner: string; repository_name: string; author: string }[] | null };

    const contributorCounts = (devMetrics ?? [] as { repository_owner: string; repository_name: string; author: string }[]).reduce<Record<string, Set<string>>>((acc, dev) => {
      const key = `${dev.repository_owner}/${dev.repository_name}`;
      if (!acc[key]) {
        acc[key] = new Set<string>();
      }
      if (typeof dev.author === 'string') {
        acc[key].add(dev.author);
      }
      return acc;
    }, {});

    // Combine data
    const options: RepositoryOption[] = (repos || [] as { owner: string; name: string; description: string | null; is_benchmark: boolean }[]).map(repo => {
      const key = `${repo.owner}/${repo.name}`;
      const stats = repoStats[key] ?? { prCount: 0 };
      const contributors = contributorCounts[key] ?? new Set<string>();

      return {
        owner: repo.owner,
        name: repo.name,
        fullName: `${repo.owner}/${repo.name}`,
        description: repo.description || undefined,
        prCount: stats.prCount,
        contributorCount: contributors.size,
        isBenchmark: repo.is_benchmark,
      };
    });

    // Sort: Supabase first, then benchmarks, then by PR count
    return options.sort((a, b) => {
      // Supabase always first
      if (a.owner === 'supabase' && a.name === 'supabase') return -1;
      if (b.owner === 'supabase' && b.name === 'supabase') return 1;

      // Then by PR count
      return (b.prCount || 0) - (a.prCount || 0);
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return [
      {
        owner: DEFAULT_REPO.owner,
        name: DEFAULT_REPO.name,
        fullName: DEFAULT_REPO.fullName,
        isBenchmark: false,
      },
    ];
  }
}

/**
 * Parse repository from URL params or return default
 */
export function parseRepositoryFromUrl(searchParams: URLSearchParams): {
  owner: string;
  name: string;
} {
  const repo = searchParams.get('repo');

  if (repo && repo.includes('/')) {
    const [owner, name] = repo.split('/');
    if (owner && name) {
      return { owner, name };
    }
  }

  return { owner: DEFAULT_REPO.owner, name: DEFAULT_REPO.name };
}

/**
 * Build URL with repository parameter
 */
export function buildRepositoryUrl(owner: string, name: string, basePath: string = '/'): string {
  const params = new URLSearchParams();
  params.set('repo', `${owner}/${name}`);
  return `${basePath}?${params.toString()}`;
}

/**
 * Check if a repository is the default (Supabase)
 */
export function isDefaultRepository(owner: string, name: string): boolean {
  return owner === DEFAULT_REPO.owner && name === DEFAULT_REPO.name;
}
