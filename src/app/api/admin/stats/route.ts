import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth-helpers';
import { getArticles } from '@/lib/contentful';
import { STATIC_PAGES, SLUG_ALIASES } from '@/lib/static-pages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [statsResult, daily30Result, dailyAllResult, prev7dResult, articles] = await Promise.all([
    supabase.rpc('get_view_stats'),
    supabase.rpc('get_daily_views', { days_back: 30 }),
    supabase.rpc('get_daily_views', { days_back: 0 }),
    supabase.rpc('get_period_totals', { days_start: 14, days_end: 7 }),
    getArticles().catch(() => []),
  ]);

  if (statsResult.error) {
    console.error('Stats error:', statsResult.error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
  if (daily30Result.error)  console.error('Daily 30 error:', daily30Result.error);
  if (dailyAllResult.error) console.error('Daily all error:', dailyAllResult.error);
  if (prev7dResult.error)   console.error('Prev 7d error:', prev7dResult.error);

  // Build two maps:
  //   titleMap:         key → human title
  //   canonicalSlugMap: key → canonical URL slug
  // Both keyed by contentfulId AND slug so old tracking data is handled.
  const titleMap: Record<string, string> = {};
  const canonicalSlugMap: Record<string, string> = {};
  for (const a of articles) {
    titleMap[a.slug] = a.title;
    titleMap[a.id]   = a.title;
    canonicalSlugMap[a.slug] = a.slug;
    canonicalSlugMap[a.id]   = a.slug; // contentfulId → URL slug
  }
  for (const p of STATIC_PAGES) {
    titleMap[p.slug] = p.title;
    canonicalSlugMap[p.slug] = p.slug;
  }
  // Map legacy slugs onto their renamed canonical slug + carry the title over.
  for (const [legacy, canonical] of Object.entries(SLUG_ALIASES)) {
    canonicalSlugMap[legacy] = canonical;
    if (titleMap[canonical]) titleMap[legacy] = titleMap[canonical];
  }

  // Merge rows that share the same canonical slug (old contentfulId + new slug key)
  const merged: Record<string, {
    slug: string;
    title: string;
    total_views: number;
    views_7d: number;
    views_30d: number;
    views_prev_7d: number;
  }> = {};

  for (const row of (statsResult.data ?? []) as {
    slug: string; total_views: number; views_7d: number; views_30d: number; views_prev_7d: number;
  }[]) {
    const canonical = canonicalSlugMap[row.slug] ?? row.slug;
    if (merged[canonical]) {
      merged[canonical].total_views   += Number(row.total_views);
      merged[canonical].views_7d      += Number(row.views_7d);
      merged[canonical].views_30d     += Number(row.views_30d);
      merged[canonical].views_prev_7d += Number(row.views_prev_7d);
    } else {
      merged[canonical] = {
        slug:           canonical,
        title:          titleMap[row.slug] ?? row.slug,
        total_views:    Number(row.total_views),
        views_7d:       Number(row.views_7d),
        views_30d:      Number(row.views_30d),
        views_prev_7d:  Number(row.views_prev_7d),
      };
    }
  }

  const stats = Object.values(merged).sort((a, b) => b.total_views - a.total_views);

  return NextResponse.json({
    stats,
    daily30:   daily30Result.data ?? [],
    dailyAll:  dailyAllResult.data ?? [],
    prev7dTotal: Number(prev7dResult.data ?? 0),
  });
}
