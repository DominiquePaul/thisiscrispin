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
/**
 * Legacy view-tracking slugs → current canonical slug. Lets historical
 * `view_events` survive a page rename so the dashboard keeps counting them.
 */
export const SLUG_ALIASES: Record<string, string> = {
  "pi-models": "robotic-ai-model-specs",
};

/**
 * Pages tracked for views but NOT surfaced in the homepage feed — the homepage
 * itself plus standalone routes. Maps the tracking slug to a human title so the
 * stats dashboard labels them nicely instead of showing the raw slug.
 */
export const EXTRA_PAGE_TITLES: Record<string, string> = {
  home: "Home",
  shots: "Photography",
  "robot-arms": "Robot Arms",
  "blog-index": "Blog index",
};

export const STATIC_PAGES: Article[] = [
  {
    id: "static-pi-models",
    slug: "robotic-ai-model-specs",
    href: "/robotic-ai-model-specs",
    title: "Robot Learning Architecture Overview",
    coverImage: "/images/policy-architectures-cover.png",
    excerpt:
      "A field guide to how robot manipulation policies represent actions, from ACT and Diffusion Policy, through Physical Intelligence's π family, to the new World Action Models (mimic-video, DreamZero), fact-checked against the source papers and code.",
    tags: ["devProjects"],
    createdAt: "2026-04-22T00:00:00.000Z",
  },
  {
    id: "static-captable-calculator",
    slug: "captable-calculator",
    href: "/captable-calculator",
    title: "Founder Cap Table Calculator",
    coverImage: "/images/founder-cap-table-cover.png",
    excerpt:
      "Simulate dilution across funding rounds: founders, ESOP, SAFEs, priced rounds, and exits.",
    tags: ["devProjects"],
    createdAt: "2026-03-26T00:00:00.000Z",
  },
];
