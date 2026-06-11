"use client";

import { useEffect } from "react";

/**
 * Fire-and-forget view counter for a page. Drop `<PageViewTracker slug="…" />`
 * into any route (works inside server components too) to register a visit in the
 * same Supabase tracking used by blog posts and the stats dashboard.
 */
export default function PageViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/views/${slug}`, { method: "POST" }).catch(() => {});
  }, [slug]);
  return null;
}
