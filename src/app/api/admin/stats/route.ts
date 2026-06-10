import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth-helpers';
import { getArticles } from '@/lib/contentful';
import { STATIC_PAGES } from '@/lib/static-pages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [statsResult, dailyResult, articles] = await Promise.all([
    supabase.rpc('get_view_stats'),
    supabase.rpc('get_daily_views', { days_back: 30 }),
    getArticles().catch(() => []),
  ]);

  if (statsResult.error) {
    console.error('Stats error:', statsResult.error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  // Build slug → title map from Contentful articles + static pages
  const titleMap: Record<string, string> = {};
  for (const a of articles) titleMap[a.slug] = a.title;
  for (const p of STATIC_PAGES) titleMap[p.slug] = p.title;

  const stats = (statsResult.data ?? []).map((row: {
    slug: string;
    total_views: number;
    views_7d: number;
    views_30d: number;
  }) => ({
    ...row,
    title: titleMap[row.slug] ?? row.slug,
  }));

  return NextResponse.json({
    stats,
    daily: dailyResult.data ?? [],
  });
}
