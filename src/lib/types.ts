export interface Article {
    id: string;
    slug: string;
    title: string;
    coverImage?: string;
    excerpt: string;
    tags: string[];
    createdAt: string;
    /** Optional override link target. When set, BlogContent links here instead of /p/[slug]. */
    href?: string;
  }
  