import { NextRequest, NextResponse } from 'next/server';

import { syncRepository, upsertRepositoryMetadata } from '@/lib/github-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const owner = (body.owner as string | undefined)?.trim();
    const name = (body.name as string | undefined)?.trim();
    const description = (body.description as string | undefined)?.trim();
    const companySize = (body.companySize as string | undefined)?.trim();
    const industry = (body.industry as string | undefined)?.trim();
    const isBenchmark = Boolean(body.isBenchmark);
    const perRepo = typeof body.perRepo === 'number' ? body.perRepo : 100;
    const token = (body.token as string | undefined)?.trim();

    if (!owner || !name) {
      return NextResponse.json(
        { error: 'Repository owner and name are required' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub personal access token is required' },
        { status: 400 }
      );
    }

    await upsertRepositoryMetadata({
      owner,
      name,
      description: description || null,
      companySize: companySize || null,
      industry: industry || null,
      isBenchmark,
    });

    const result = await syncRepository({
      owner,
      name,
      perRepo,
      token,
    });

    return NextResponse.json({
      success: true,
      repository: {
        owner,
        name,
      },
      stats: {
        total: result.total,
        new: result.newCount,
        updated: result.updatedCount,
        errors: result.errorCount,
      },
      message: `Added ${owner}/${name} (${result.total} PRs synced)`
    });
  } catch (error) {
    console.error('Add repository error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
