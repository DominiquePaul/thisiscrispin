import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth-helpers';
import { getArticles } from '@/lib/contentful';
import { STATIC_PAGES, SLUG_ALIASES, EXTRA_PAGE_TITLES } from '@/lib/static-pages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const TIMEFRAME_DAYS: Record<string, number> = {
  '7d': 7, '30d': 30, '3m': 90, 'all': 0,
};

export async function GET(req: NextRequest) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const timeframe = req.nextUrl.searchParams.get('timeframe') ?? '30d';
  const daysBack = TIMEFRAME_DAYS[timeframe] ?? 30;

  const [rawResult, articles] = await Promise.all([
    supabase.rpc('get_views_by_page_and_day', { days_back: daysBack }),
    getArticles().catch(() => []),
  ]);

  if (rawResult.error) {
    console.error('Chart data error:', rawResult.error);
    return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
  }

  // Build title + canonical slug maps
  const titleMap: Record<string, string> = {};
  const canonicalMap: Record<string, string> = {};
  for (const a of articles) {
    titleMap[a.slug] = a.title;    titleMap[a.id] = a.title;
    canonicalMap[a.slug] = a.slug; canonicalMap[a.id] = a.slug;
  }
  for (const p of STATIC_PAGES) {
    titleMap[p.slug] = p.title; canonicalMap[p.slug] = p.slug;
  }
  for (const [slug, title] of Object.entries(EXTRA_PAGE_TITLES)) {
    titleMap[slug] = title; canonicalMap[slug] = slug;
  }
  for (const [legacy, canonical] of Object.entries(SLUG_ALIASES)) {
    canonicalMap[legacy] = canonical;
    if (titleMap[canonical]) titleMap[legacy] = titleMap[canonical];
  }

  // Aggregate per canonical slug per day, merging old contentfulId keys
  const daySlug: Record<string, Record<string, number>> = {};
  const slugTotals: Record<string, number> = {};

  for (const row of (rawResult.data ?? []) as { slug: string; day: string; views: number }[]) {
    const canonical = canonicalMap[row.slug] ?? row.slug;
    const day = typeof row.day === 'string' ? row.day : (row.day as Date).toISOString().split('T')[0];
    const views = Number(row.views);
    if (!daySlug[day]) daySlug[day] = {};
    daySlug[day][canonical] = (daySlug[day][canonical] ?? 0) + views;
    slugTotals[canonical] = (slugTotals[canonical] ?? 0) + views;
  }

  // Flatten back to rows
  const rows = Object.entries(daySlug).flatMap(([day, pages]) =>
    Object.entries(pages).map(([slug, views]) => ({ slug, day, views }))
  );

  // Slugs ordered by total views desc
  const slugs = Object.keys(slugTotals).sort((a, b) => slugTotals[b] - slugTotals[a]);
  const titles = Object.fromEntries(slugs.map(s => [s, titleMap[s] ?? s]));

  return NextResponse.json({ rows, slugs, titles });
}
