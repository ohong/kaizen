import { NextRequest, NextResponse } from 'next/server';
import { getGitHubToken, syncRepository } from '@/lib/github-sync';

interface SyncStats {
  total: number;
  new: number;
  updated: number;
  errors: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stateParam = (searchParams.get('state') || 'all') as 'open' | 'closed' | 'all';
    const perPage = parseInt(searchParams.get('perPage') || '50', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const owner = searchParams.get('owner') || 'supabase';
    const name = searchParams.get('name') || 'supabase';

    if (!['open', 'closed', 'all'].includes(stateParam)) {
      return NextResponse.json(
        { error: 'Invalid state parameter. Must be: open, closed, or all' },
        { status: 400 }
      );
    }

    if (Number.isNaN(perPage) || perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'perPage must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (Number.isNaN(page) || page < 1) {
      return NextResponse.json(
        { error: 'page must be at least 1' },
        { status: 400 }
      );
    }

    const githubToken = getGitHubToken();

    const result = await syncRepository({
      owner,
      name,
      perRepo: perPage,
      state: stateParam,
      token: githubToken,
      page,
    });

    const stats: SyncStats = {
      total: result.total,
      new: result.newCount,
      updated: result.updatedCount,
      errors: result.errorCount,
    };

    return NextResponse.json({
      success: true,
      stats,
      repository: {
        owner,
        name,
      },
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
