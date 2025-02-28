import { getArticleBySlug, getArticles } from '@/lib/contentful';
import { notFound } from 'next/navigation';
import BlogPost from '@/components/BlogPost';

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return <BlogPost contentfulId={article.id} />;
}