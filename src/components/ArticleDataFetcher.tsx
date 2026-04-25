import { getArticles } from '@/lib/contentful';
import { STATIC_PAGES } from '@/lib/static-pages';

export default async function ArticleDataFetcher() {
  const contentful = await getArticles();
  // Merge Contentful posts with hand-curated in-app pages, sorted newest first.
  const articles = [...contentful, ...STATIC_PAGES].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const allTags = Array.from(new Set(articles.flatMap(article => article.tags)));

  // This will be parsed and passed as props to the client component
  return { articles, allTags };
}