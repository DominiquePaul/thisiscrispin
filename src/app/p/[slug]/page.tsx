import { getArticleBySlug, getArticles } from '@/lib/contentful';
import { notFound } from 'next/navigation';
import BlogPost from '@/components/BlogPost';
import { Metadata } from 'next/types';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Article Not Found'
    };
  }

  return {
    title: article.title as string,
    description: article.excerpt as string || '',
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return <BlogPost contentfulId={article.id} />;
}