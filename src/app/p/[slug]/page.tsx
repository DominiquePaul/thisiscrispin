import { getArticleBySlug, getArticles } from '@/lib/contentful';
import { notFound } from 'next/navigation';
import BlogPost from '@/components/BlogPost';
import { Metadata } from 'next/types';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
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
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Article'
    };
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const article = await getArticleBySlug(slug);

  if (!article) {
    // Show a friendly message instead of 404 when Contentful is unavailable
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Article Unavailable</h1>
          <p className="text-gray-600">This article could not be loaded right now. Please try again later.</p>
        </div>
      </div>
    );
  }

  return <BlogPost contentfulId={article.id} />;
}