import type { Article } from "./types";

/**
 * In-app pages that should appear in the homepage "Writing" feed alongside
 * Contentful blog posts. Each entry uses the same shape as a Contentful
 * Article but carries an `href` so BlogContent links straight to the route
 * instead of /p/[slug].
 *
 * Dates are pulled from the page's first commit so they sort naturally in
 * the timeline; bump them if you want a page to surface higher.
 */
export const STATIC_PAGES: Article[] = [
  {
    id: "static-pi-models",
    slug: "pi-models",
    href: "/pi-models",
    title: "The π model family",
    excerpt:
      "A side-by-side of Physical Intelligence's VLA models — π0, π0.5, π0.6 / π*0.6, and π0.7 — fact-checked against the source papers.",
    tags: ["writing"],
    createdAt: "2026-04-22T00:00:00.000Z",
  },
  {
    id: "static-captable-calculator",
    slug: "captable-calculator",
    href: "/captable-calculator",
    title: "Cap table calculator",
    excerpt:
      "Simulate dilution across funding rounds — founders, ESOP, SAFEs, priced rounds, and exits.",
    tags: ["devProjects"],
    createdAt: "2026-03-26T00:00:00.000Z",
  },
];
