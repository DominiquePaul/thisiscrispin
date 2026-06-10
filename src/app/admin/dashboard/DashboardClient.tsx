"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stat {
  slug: string;
  title: string;
  total_views: number;
  views_7d: number;
  views_30d: number;
}

interface DailyView {
  day: string;
  views: number;
}

interface StatsData {
  stats: Stat[];
  daily30: DailyView[];
  dailyAll: DailyView[];
}

// Fill in missing days in a date range so the chart has no gaps
function fillDailyGaps(data: DailyView[], allTime = false): DailyView[] {
  if (!data.length) return data;
  const end = new Date();
  const start = allTime
    ? new Date(data[0].day)
    : (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })();
  const map: Record<string, number> = {};
  for (const d of data) map[d.day] = Number(d.views);
  const result: DailyView[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    result.push({ day: key, views: map[key] ?? 0 });
  }
  return result;
}

function BarChart({ data, allTime }: { data: DailyView[]; allTime?: boolean }) {
  const filled = fillDailyGaps(data, allTime);
  const max = Math.max(...filled.map(d => d.views), 1);
  const H = 80;
  const W = 100;
  const gap = 0.8;
  const barW = (W - gap * (filled.length - 1)) / filled.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height: H * 2 }}
      >
        {filled.map((d, i) => {
          const h = Math.max(1, (d.views / max) * H);
          const x = i * (barW + gap);
          return (
            <rect
              key={d.day}
              x={x}
              y={H - h}
              width={barW}
              height={h}
              fill="rgb(18,18,22)"
              opacity={d.views === 0 ? 0.06 : 0.12 + (d.views / max) * 0.72}
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-[#C8C8C8] mt-1">
        <span>{filled[0]?.day}</span>
        <span>{filled[filled.length - 1]?.day}</span>
      </div>
    </div>
  );
}

type SortKey = 'total_views' | 'views_7d' | 'views_30d';
type Period = '30d' | 'all';

export default function DashboardClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('total_views');
  const [period, setPeriod] = useState<Period>('30d');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => {
        if (!r.ok) throw new Error('Unauthorized or error');
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load — are you logged in as admin?'); setLoading(false); });
  }, []);

  const totalViews = data?.stats.reduce((s, r) => s + Number(r.total_views), 0) ?? 0;
  const views7d = data?.stats.reduce((s, r) => s + Number(r.views_7d), 0) ?? 0;
  const today = new Date().toISOString().split('T')[0];
  const viewsToday = data?.daily30.find(d => d.day === today)?.views ?? 0;
  const chartData = period === '30d' ? (data?.daily30 ?? []) : (data?.dailyAll ?? []);

  const sorted = data
    ? [...data.stats].sort((a, b) => Number(b[sort]) - Number(a[sort]))
    : [];

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className={`text-right pb-3 font-normal cursor-pointer select-none transition-colors ${sort === col ? 'text-[rgb(18,18,22)]' : 'text-[#C8C8C8] hover:text-[#9A9A9A]'}`}
      onClick={() => setSort(col)}
    >
      {label}{sort === col ? ' ↓' : ''}
    </th>
  );

  return (
    <div
      className="min-h-screen pt-20 pb-32 px-[5%] sm:px-[10%] 2xl:px-[20%]"
      style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
    >
      <div className="max-w-3xl py-12">
        <div className="flex items-baseline justify-between mb-12">
          <h1 className="text-2xl tracking-[-0.03em] text-[rgb(18,18,22)]">Stats</h1>
          <Link href="/" className="text-xs text-[#9A9A9A] hover:text-[rgb(18,18,22)] transition-colors">
            ← home
          </Link>
        </div>

        {loading && (
          <p className="text-[#9A9A9A] text-sm">Loading…</p>
        )}
        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        {data && (
          <>
            {/* Summary numbers */}
            <div className="flex gap-12 mb-16">
              {[
                { label: 'All time', value: totalViews },
                { label: 'Last 7 days', value: views7d },
                { label: 'Today', value: Number(viewsToday) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-1">{label}</div>
                  <div className="text-3xl tracking-[-0.03em] text-[rgb(18,18,22)]">{value.toLocaleString()}</div>
                </div>
              ))}
            </div>

            {/* Chart with period toggle */}
            <div className="mb-16">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em]">Daily views</div>
                <div className="flex gap-3 text-[10px] uppercase tracking-[0.15em]">
                  {(['30d', 'all'] as Period[]).map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`transition-colors ${period === p ? 'text-[rgb(18,18,22)]' : 'text-[#C8C8C8] hover:text-[#9A9A9A]'}`}
                    >
                      {p === '30d' ? 'Last 30 days' : 'All time'}
                    </button>
                  ))}
                </div>
              </div>
              <BarChart data={chartData} allTime={period === 'all'} />
            </div>

            {/* Per-page table */}
            <div>
              <div className="text-[#9A9A9A] text-[10px] uppercase tracking-[0.2em] mb-4">By page</div>
              {sorted.length === 0 ? (
                <p className="text-[#9A9A9A] text-sm">No data yet.</p>
              ) : (
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.15em]">
                      <th className="text-left pb-3 font-normal text-[#C8C8C8]">Page</th>
                      <SortHeader col="total_views" label="All time" />
                      <SortHeader col="views_7d" label="7d" />
                      <SortHeader col="views_30d" label="30d" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((s, i) => (
                      <tr
                        key={s.slug}
                        className={`border-t ${i === 0 ? 'border-[#E8E8E8]' : 'border-[#F0F0F0]'}`}
                      >
                        <td className="py-3 pr-6 text-[rgb(18,18,22)] truncate max-w-[220px]" title={s.title}>
                          {s.title}
                        </td>
                        <td className="py-3 text-right text-[rgb(45,45,52)]">
                          {Number(s.total_views).toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-[#9A9A9A]">
                          {Number(s.views_7d).toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-[#9A9A9A]">
                          {Number(s.views_30d).toLocaleString()}
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
