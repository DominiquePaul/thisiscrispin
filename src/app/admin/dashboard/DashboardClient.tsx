"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── types ────────────────────────────────────────────────────────────────────

interface Stat {
  slug: string; title: string;
  total_views: number; views_7d: number; views_30d: number; views_prev_7d: number;
}
interface DailyView  { day: string; views: number; }
interface StatsData  { stats: Stat[]; daily30: DailyView[]; dailyAll: DailyView[]; prev7dTotal: number; }
interface ChartRow   { slug: string; day: string; views: number; }
interface BucketData { period: string; label: string; pages: Record<string, number>; total: number; }
interface ChartApiData { rows: ChartRow[]; slugs: string[]; titles: Record<string, string>; }

type Timeframe = '7d' | '30d' | '3m' | 'all';
type Grouping  = 'day' | 'week' | 'month';
type SortKey   = 'total_views' | 'views_7d' | 'views_30d';

// ─── constants ────────────────────────────────────────────────────────────────

const PAGE_COLORS = [
  '#4F46E5', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6',
  '#84CC16', '#F97316',
];

const TF_DAYS: Record<Timeframe, number>    = { '7d': 7, '30d': 30, '3m': 90, 'all': 0 };
const TF_DEFAULT_GROUP: Record<Timeframe, Grouping> = { '7d': 'day', '30d': 'day', '3m': 'week', 'all': 'month' };
const TF_GROUP_OPTIONS: Record<Timeframe, Grouping[]> = {
  '7d': ['day'], '30d': ['day', 'week'], '3m': ['week', 'month'], 'all': ['month'],
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function pctChange(cur: number, prev: number): string | null {
  if (prev === 0) return cur > 0 ? 'new' : null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return p >= 0 ? `+${p}%` : `${p}%`;
}

function Delta({ current, prev }: { current: number; prev: number }) {
  const label = pctChange(current, prev);
  if (!label) return null;
  const pos = label === 'new' || label.startsWith('+');
  return (
    <span className={`ml-2 text-[11px] ${pos ? 'text-emerald-500' : 'text-red-400'}`}>{label}</span>
  );
}

function getMonday(d: Date): Date {
  const r = new Date(d.getTime());
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7));
  r.setHours(0, 0, 0, 0);
  return r;
}

function dayLabel(d: Date)   { return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function weekLabel(d: Date)  { return getMonday(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); }
function monthLabel(d: Date) { return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }); }

function toBuckets(rows: ChartRow[], grouping: Grouping): BucketData[] {
  const map: Record<string, BucketData> = {};
  for (const row of rows) {
    const d = new Date(row.day + 'T00:00:00');
    let period: string, label: string;
    if (grouping === 'day') {
      period = row.day; label = dayLabel(d);
    } else if (grouping === 'week') {
      const mon = getMonday(d); period = mon.toISOString().split('T')[0]; label = dayLabel(mon);
    } else {
      period = row.day.slice(0, 7); label = monthLabel(d);
    }
    if (!map[period]) map[period] = { period, label, pages: {}, total: 0 };
    map[period].pages[row.slug] = (map[period].pages[row.slug] ?? 0) + row.views;
    map[period].total += row.views;
  }
  return Object.values(map).sort((a, b) => a.period.localeCompare(b.period));
}

function fillBuckets(buckets: BucketData[], timeframe: Timeframe, grouping: Grouping): BucketData[] {
  const existing = new Map(buckets.map(b => [b.period, b]));
  const result: BucketData[] = [];
  const now = new Date();

  if (grouping === 'day') {
    const days = TF_DAYS[timeframe] || 90;
    const start = new Date(now); start.setDate(now.getDate() - days + 1);
    for (const d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().split('T')[0];
      result.push(existing.get(k) ?? { period: k, label: dayLabel(new Date(d)), pages: {}, total: 0 });
    }
  } else if (grouping === 'week') {
    const days = TF_DAYS[timeframe] || 90;
    const start = getMonday(new Date(now.getTime() - days * 86_400_000));
    for (const d = new Date(start); d <= now; d.setDate(d.getDate() + 7)) {
      const k = d.toISOString().split('T')[0];
      result.push(existing.get(k) ?? { period: k, label: dayLabel(new Date(d)), pages: {}, total: 0 });
    }
  } else {
    const earliest = buckets.length
      ? new Date(buckets[0].period + '-01')
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const start = timeframe === 'all' ? earliest : new Date(now.getFullYear(), now.getMonth() - 3, 1);
    for (const d = new Date(start.getFullYear(), start.getMonth(), 1); d <= now; d.setMonth(d.getMonth() + 1)) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      result.push(existing.get(k) ?? { period: k, label: monthLabel(new Date(d)), pages: {}, total: 0 });
    }
  }
  return result;
}

// ─── StackedBarChart ──────────────────────────────────────────────────────────

function StackedBarChart({
  buckets, slugs, titles, colors,
}: {
  buckets: BucketData[]; slugs: string[];
  titles: Record<string, string>; colors: Record<string, string>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; bucket: BucketData } | null>(null);

  const hasData = buckets.some(b => b.total > 0);
  if (!hasData) {
    return (
      <div className="flex items-center justify-center text-[#C8C8C8] text-[10px] uppercase tracking-[0.2em]" style={{ height: 200 }}>
        No views in this period
      </div>
    );
  }

  const H = 100;
  const W = 100;
  const N = buckets.length;
  const gap = Math.max(0.3, Math.min(1.5, 12 / N));
  const barW = (W - gap * (N - 1)) / N;
  const maxTotal = Math.max(...buckets.map(b => b.total), 1);

  // Show at most 8 x-axis labels
  const labelStep = Math.max(1, Math.ceil(N / 8));

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: 200, display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {buckets.map((b, i) => {
          const x = i * (barW + gap);
          let yOff = H;
          const segs = slugs
            .filter(s => (b.pages[s] ?? 0) > 0)
            .map(s => {
              const h = Math.max(0.4, (b.pages[s] / maxTotal) * H);
              yOff -= h;
              return { slug: s, h, y: yOff };
            });
          return (
            <g
              key={b.period}
              onMouseEnter={e => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, bucket: b });
              }}
            >
              {/* full-height transparent hit area */}
              <rect x={x} y={0} width={barW} height={H} fill="transparent" />
              {segs.map(({ slug, h, y }) => (
                <rect key={slug} x={x} y={y} width={barW} height={h} fill={colors[slug] ?? '#888'} opacity={0.88} />
              ))}
              {b.total === 0 && (
                <rect x={x} y={H - 0.4} width={barW} height={0.4} fill="#E8E8E8" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 rounded-sm text-[10px] leading-relaxed"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 600) - 190),
            top: Math.max(tooltip.y - 90, 4),
            background: 'rgb(18,18,22)', color: '#fff',
            padding: '8px 10px', minWidth: 170,
            fontFamily: 'var(--font-jetbrains-mono)',
          }}
        >
          <div style={{ marginBottom: 6, opacity: 0.5, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            {tooltip.bucket.label} · {tooltip.bucket.total} views
          </div>
          {slugs
            .filter(s => (tooltip.bucket.pages[s] ?? 0) > 0)
            .sort((a, z) => (tooltip.bucket.pages[z] ?? 0) - (tooltip.bucket.pages[a] ?? 0))
            .map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[s], flexShrink: 0, display: 'inline-block' }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{titles[s] ?? s}</span>
                <span style={{ opacity: 0.65, paddingLeft: 6, flexShrink: 0 }}>{tooltip.bucket.pages[s]}</span>
              </div>
            ))}
        </div>
      )}

      {/* X-axis labels */}
      <div className="relative" style={{ height: 18, marginTop: 6 }}>
        {buckets.map((b, i) => {
          if (i % labelStep !== 0 && i !== N - 1) return null;
          const pct = ((i + 0.5) / N) * 100;
          return (
            <span
              key={b.period}
              className="absolute text-[9px] text-[#C8C8C8]"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              {b.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend({ slugs, titles, colors }: { slugs: string[]; titles: Record<string, string>; colors: Record<string, string> }) {
  if (!slugs.length) return null;
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
      {slugs.map(s => (
        <div key={s} className="flex items-center gap-1.5 text-[10px] text-[#9A9A9A]">
          <span style={{ width: 8, height: 8, borderRadius: 2, background: colors[s], display: 'inline-block', flexShrink: 0 }} />
          <span>{titles[s] ?? s}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DashboardClient ──────────────────────────────────────────────────────────

export default function DashboardClient() {
  const [stats,       setStats]       = useState<StatsData | null>(null);
  const [chartApi,    setChartApi]    = useState<ChartApiData | null>(null);
  const [statsLoad,   setStatsLoad]   = useState(true);
  const [chartLoad,   setChartLoad]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [sort,        setSort]        = useState<SortKey>('total_views');
  const [timeframe,   setTimeframe]   = useState<Timeframe>('30d');
  const [grouping,    setGrouping]    = useState<Grouping>('day');

  // Fetch overall stats once
  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(d => { setStats(d); setStatsLoad(false); })
      .catch(() => { setError('Failed to load — are you logged in as admin?'); setStatsLoad(false); });
  }, []);

  // Fetch chart data on timeframe change; reset grouping to default
  useEffect(() => {
    setGrouping(TF_DEFAULT_GROUP[timeframe]);
    setChartLoad(true);
    fetch(`/api/admin/chart?timeframe=${timeframe}`)
      .then(r => r.json())
      .then(d => { setChartApi(d); setChartLoad(false); })
      .catch(() => setChartLoad(false));
  }, [timeframe]);

  // Derived chart data
  const colorMap = Object.fromEntries(
    (chartApi?.slugs ?? []).map((s, i) => [s, PAGE_COLORS[i % PAGE_COLORS.length]])
  );
  const rawBuckets  = toBuckets(chartApi?.rows ?? [], grouping);
  const buckets     = fillBuckets(rawBuckets, timeframe, grouping);

  // Summary numbers
  const totalViews     = stats?.stats.reduce((s, r) => s + r.total_views, 0) ?? 0;
  const views7d        = stats?.stats.reduce((s, r) => s + r.views_7d, 0) ?? 0;
  const prev7d         = stats?.prev7dTotal ?? 0;
  const today          = new Date().toISOString().split('T')[0];
  const yesterday      = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0]; })();
  const viewsToday     = Number(stats?.daily30.find(d => d.day === today)?.views ?? 0);
  const viewsYesterday = Number(stats?.daily30.find(d => d.day === yesterday)?.views ?? 0);

  const sorted = stats ? [...stats.stats].sort((a, b) => Number(b[sort]) - Number(a[sort])) : [];

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className={`text-right pb-3 font-normal cursor-pointer select-none transition-colors ${sort === col ? 'text-[rgb(18,18,22)]' : 'text-[#C8C8C8] hover:text-[#9A9A9A]'}`}
      onClick={() => setSort(col)}
    >
      {label}{sort === col ? ' ↓' : ''}
    </th>
  );

  return (
    <div className="min-h-screen pt-20 pb-32 px-[5%] sm:px-[10%] 2xl:px-[20%]" style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
      <div className="max-w-3xl py-12">

        {/* Header */}
        <div className="flex items-baseline justify-between mb-12">
          <h1 className="text-2xl tracking-[-0.03em] text-[rgb(18,18,22)]">Stats</h1>
          <Link href="/" className="text-xs text-[#9A9A9A] hover:text-[rgb(18,18,22)] transition-colors">← home</Link>
        </div>

        {statsLoad && <p className="text-[#9A9A9A] text-sm">Loading…</p>}
        {error     && <p className="text-red-500 text-sm">{error}</p>}

        {stats && (
          <>
            {/* Summary numbers */}
            <div className="flex gap-12 mb-16">
              <div>
                <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-1">All time</div>
                <div className="text-3xl tracking-[-0.03em] text-[rgb(18,18,22)]">{totalViews.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-1">Last 7 days</div>
                <div className="flex items-baseline">
                  <span className="text-3xl tracking-[-0.03em] text-[rgb(18,18,22)]">{views7d.toLocaleString()}</span>
                  <Delta current={views7d} prev={prev7d} />
                </div>
              </div>
              <div>
                <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-1">Today</div>
                <div className="flex items-baseline">
                  <span className="text-3xl tracking-[-0.03em] text-[rgb(18,18,22)]">{viewsToday.toLocaleString()}</span>
                  <Delta current={viewsToday} prev={viewsYesterday} />
                </div>
              </div>
            </div>

            {/* Chart controls */}
            <div className="mb-4 flex items-center justify-between">
              {/* Timeframe tabs */}
              <div className="flex gap-4 text-[10px] uppercase tracking-[0.15em]">
                {(['7d', '30d', '3m', 'all'] as Timeframe[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`transition-colors ${timeframe === tf ? 'text-[rgb(18,18,22)]' : 'text-[#C8C8C8] hover:text-[#9A9A9A]'}`}
                  >
                    {tf === 'all' ? 'All time' : tf}
                  </button>
                ))}
              </div>
              {/* Grouping toggle — only show if >1 option */}
              {TF_GROUP_OPTIONS[timeframe].length > 1 && (
                <div className="flex gap-3 text-[10px] uppercase tracking-[0.15em]">
                  {TF_GROUP_OPTIONS[timeframe].map(g => (
                    <button
                      key={g}
                      onClick={() => setGrouping(g)}
                      className={`transition-colors ${grouping === g ? 'text-[rgb(18,18,22)]' : 'text-[#C8C8C8] hover:text-[#9A9A9A]'}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Stacked bar chart */}
            <div className="mb-4">
              {chartLoad ? (
                <div className="flex items-center justify-center text-[#C8C8C8] text-[10px] uppercase tracking-[0.2em]" style={{ height: 200 }}>
                  Loading…
                </div>
              ) : (
                <StackedBarChart
                  buckets={buckets}
                  slugs={chartApi?.slugs ?? []}
                  titles={chartApi?.titles ?? {}}
                  colors={colorMap}
                />
              )}
            </div>

            {/* Legend */}
            {!chartLoad && chartApi && (
              <Legend slugs={chartApi.slugs} titles={chartApi.titles} colors={colorMap} />
            )}

            {/* Per-page table */}
            <div className="mt-16">
              <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-4">By page</div>
              {sorted.length === 0 ? (
                <p className="text-[#9A9A9A] text-sm">No data yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.15em]">
                      <th className="text-left pb-3 font-normal text-[#C8C8C8]">Page</th>
                      <SortHeader col="total_views" label="All time" />
                      <SortHeader col="views_7d"    label="7d" />
                      <SortHeader col="views_30d"   label="30d" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((s, i) => (
                      <tr key={s.slug} className={`border-t ${i === 0 ? 'border-[#E8E8E8]' : 'border-[#F0F0F0]'}`}>
                        <td className="py-3 pr-4 text-[rgb(18,18,22)]">
                          <div className="flex items-center gap-2">
                            {colorMap[s.slug] && (
                              <span style={{ width: 8, height: 8, borderRadius: 2, background: colorMap[s.slug], flexShrink: 0, display: 'inline-block' }} />
                            )}
                            <span className="truncate max-w-[200px]" title={s.title}>{s.title}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-[rgb(45,45,52)]">{s.total_views.toLocaleString()}</td>
                        <td className="py-3 text-right text-[#9A9A9A]">
                          {s.views_7d > 0
                            ? <span>{s.views_7d.toLocaleString()}<Delta current={s.views_7d} prev={s.views_prev_7d} /></span>
                            : <span className="text-[#D8D8D8]">—</span>}
                        </td>
                        <td className="py-3 text-right text-[#9A9A9A]">
                          {s.views_30d > 0 ? s.views_30d.toLocaleString() : <span className="text-[#D8D8D8]">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
