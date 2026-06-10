import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST: increment view count and return new total
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { data, error } = await supabase.rpc('increment_post_views', { post_slug: slug });
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
