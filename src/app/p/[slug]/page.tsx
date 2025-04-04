import { getArticleBySlug, getArticles } from '@/lib/contentful';
import { notFound } from 'next/navigation';
import BlogPost from '@/components/BlogPost';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return <BlogPost contentfulId={article.id} />;
}