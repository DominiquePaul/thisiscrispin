import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getArticles } from '@/lib/contentful';
import { STATIC_PAGES, SLUG_ALIASES, EXTRA_PAGE_TITLES } from '@/lib/static-pages';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY!);
const TO_EMAIL = 'dominique.c.a.paul@gmail.com';

function pct(current: number, prev: number): string {
  const c = Number(current); const p = Number(prev);
  if (!Number.isFinite(c) || !Number.isFinite(p)) return '';
  if (p === 0) return c > 0 ? ' <span style="color:#10b981;font-size:11px">new</span>' : '';
  const pct = Math.round(((c - p) / p) * 100);
  if (!Number.isFinite(pct)) return '';
  const color = pct >= 0 ? '#10b981' : '#f87171';
  return ` <span style="color:${color};font-size:11px">${pct >= 0 ? '+' : ''}${pct}%</span>`;
}

// Build an inline SVG bar chart safe for email (no interaction)
function buildBarChartSvg(data: { day: string; views: number }[]): string {
  if (!data.length) return '<p style="color:#C8C8C8;font-size:11px">No data yet</p>';
  const max = Math.max(...data.map(d => d.views), 1);
  const H = 60; const W = 500;
  const gap = 1;
  const barW = Math.floor((W - gap * (data.length - 1)) / data.length);
  const bars = data.map((d, i) => {
    const h = Math.max(1, Math.round((d.views / max) * H));
    const x = i * (barW + gap);
    const opacity = d.views === 0 ? 0.06 : (0.12 + (d.views / max) * 0.72).toFixed(2);
    return `<rect x="${x}" y="${H - h}" width="${barW}" height="${h}" fill="rgb(18,18,22)" opacity="${opacity}"/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block">${bars}</svg>`;
}

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [statsResult, daily30Result, prev7dResult, articles] = await Promise.all([
    supabase.rpc('get_view_stats'),
    supabase.rpc('get_daily_views', { days_back: 30 }),
    supabase.rpc('get_period_totals', { days_start: 14, days_end: 7 }),
    getArticles().catch(() => []),
  ]);

  if (statsResult.error) {
    console.error('Weekly digest stats error:', statsResult.error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  // Build title/canonical maps
  const titleMap: Record<string, string> = {};
  const canonicalMap: Record<string, string> = {};
  for (const a of articles) {
    titleMap[a.slug] = a.title; titleMap[a.id] = a.title;
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

  // Merge rows
  type Row = { slug: string; title: string; total_views: number; views_7d: number; views_30d: number; views_prev_7d: number };
  const merged: Record<string, Row> = {};
  for (const row of (statsResult.data ?? []) as any[]) {
    const canonical = canonicalMap[row.slug] ?? row.slug;
    if (merged[canonical]) {
      merged[canonical].total_views   += Number(row.total_views);
      merged[canonical].views_7d      += Number(row.views_7d);
      merged[canonical].views_30d     += Number(row.views_30d);
      merged[canonical].views_prev_7d += Number(row.views_prev_7d ?? 0);
    } else {
      merged[canonical] = {
        slug: canonical, title: titleMap[row.slug] ?? row.slug,
        total_views: Number(row.total_views), views_7d: Number(row.views_7d),
        views_30d: Number(row.views_30d), views_prev_7d: Number(row.views_prev_7d ?? 0),
      };
    }
  }
  const stats = Object.values(merged).sort((a, b) => b.views_7d - a.views_7d || b.total_views - a.total_views);

  const total7d   = stats.reduce((s, r) => s + r.views_7d, 0);
  const prev7d    = Number(prev7dResult.data ?? 0);
  const totalAll  = stats.reduce((s, r) => s + r.total_views, 0);

  // Build 30-day chart data (fill gaps)
  const daily: { day: string; views: number }[] = [];
  if (daily30Result.data?.length) {
    const map: Record<string, number> = {};
    for (const d of daily30Result.data as any[]) map[d.day] = Number(d.views);
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - 29);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      daily.push({ day: key, views: map[key] ?? 0 });
    }
  }

  const chartSvg = buildBarChartSvg(daily);
  const weekStart = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); })();
  const weekEnd   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  const tableRows = stats.map(s => `
    <tr>
      <td style="padding:10px 16px 10px 0;color:rgb(18,18,22);border-top:1px solid #F0F0F0;font-size:13px">${s.title}</td>
      <td style="padding:10px 0;text-align:right;color:rgb(45,45,52);border-top:1px solid #F0F0F0;font-size:13px">${s.total_views.toLocaleString()}</td>
      <td style="padding:10px 0 10px 16px;text-align:right;color:#9A9A9A;border-top:1px solid #F0F0F0;font-size:13px">${s.views_7d > 0 ? s.views_7d.toLocaleString() + pct(s.views_7d, s.views_prev_7d) : '<span style="color:#D8D8D8">—</span>'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F2F2F2;font-family:'JetBrains Mono',monospace,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:48px 24px">

    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9A9A9A;margin:0 0 8px">Weekly digest</p>
    <h1 style="font-size:24px;letter-spacing:-0.03em;color:rgb(18,18,22);margin:0 0 40px;font-weight:400">${weekStart} – ${weekEnd}</h1>

    <!-- Summary numbers -->
    <table cellpadding="0" cellspacing="0" style="margin-bottom:40px">
      <tr>
        <td style="padding-right:40px">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9A9A9A;margin:0 0 4px">All time</p>
          <p style="font-size:28px;letter-spacing:-0.03em;color:rgb(18,18,22);margin:0;font-weight:400">${totalAll.toLocaleString()}</p>
        </td>
        <td style="padding-right:40px">
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9A9A9A;margin:0 0 4px">This week</p>
          <p style="font-size:28px;letter-spacing:-0.03em;color:rgb(18,18,22);margin:0;font-weight:400">${total7d.toLocaleString()}${pct(total7d, prev7d)}</p>
        </td>
      </tr>
    </table>

    <!-- Bar chart -->
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9A9A9A;margin:0 0 12px">Last 30 days</p>
    ${chartSvg}
    <p style="font-size:10px;color:#C8C8C8;margin:4px 0 40px;display:flex;justify-content:space-between">
      <span>${daily[0]?.day ?? ''}</span><span>${daily[daily.length - 1]?.day ?? ''}</span>
    </p>

    <!-- Per-page table -->
    <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#9A9A9A;margin:0 0 4px">By page</p>
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left;padding-bottom:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C8C8C8;font-weight:400">Page</th>
          <th style="text-align:right;padding-bottom:8px;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C8C8C8;font-weight:400">All time</th>
          <th style="text-align:right;padding-bottom:8px;padding-left:16px;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#C8C8C8;font-weight:400">7d</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <p style="margin:48px 0 0;font-size:11px;color:#C8C8C8">
      <a href="https://thisiscrispin.com/admin/dashboard" style="color:#C8C8C8">View full dashboard</a>
    </p>
  </div>
</body>
</html>`;

  const { error: sendError } = await resend.emails.send({
    from: 'thisiscrispin <onboarding@resend.dev>',
    to: TO_EMAIL,
    subject: `Weekly stats: ${total7d} views (${weekStart} – ${weekEnd})`,
    html,
  });

  if (sendError) {
    console.error('Failed to send weekly digest', sendError);
    return NextResponse.json({ error: 'Email send failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, views7d: total7d });
}
