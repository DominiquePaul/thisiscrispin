import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/** SHA-256 of (ip + YYYY-MM-DD) — resets daily, never stores raw IP */
async function hashIp(ip: string): Promise<string> {
  const salt = new Date().toISOString().split('T')[0]; // e.g. "2025-06-10"
  const data = new TextEncoder().encode(ip + salt);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** "mobile" or "desktop" based on user-agent */
function getDevice(ua: string): string {
  return /mobile|android|iphone|ipad|tablet/i.test(ua) ? 'mobile' : 'desktop';
}

/** Return just the hostname of the referrer, or null for self-refs / missing */
function cleanReferrer(ref: string | null): string | null {
  if (!ref) return null;
  try {
    const { hostname } = new URL(ref);
    if (hostname.includes('thisiscrispin.com') || hostname === 'localhost') return null;
    return hostname;
  } catch {
    return null;
  }
}

// POST: increment view count and return new total
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // --- extract metadata from request headers ---
  const country  = req.headers.get('x-vercel-ip-country') ?? null;
  const referrer = cleanReferrer(req.headers.get('referer'));
  const ua       = req.headers.get('user-agent') ?? '';
  const device   = getDevice(ua);

  // IP: Vercel sets x-forwarded-for; fall back gracefully
  const rawIp  = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const ipHash = rawIp ? await hashIp(rawIp) : null;

  const { data, error } = await supabase.rpc('increment_post_views', {
    post_slug:  slug,
    p_country:  country,
    p_referrer: referrer,
    p_device:   device,
    p_ip_hash:  ipHash,
  });

  if (error) {
    console.error('Failed to increment view count', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ views: data });
}

// GET: return current view count without incrementing
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data, error } = await supabase
    .from('post_views')
    .select('view_count')
    .eq('slug', slug)
    .single();
  if (error) return NextResponse.json({ views: 0 });
  return NextResponse.json({ views: data.view_count });
}
