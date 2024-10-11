import { getArticles } from '@/lib/contentful';

export default async function ArticleDataFetcher() {
  const articles = await getArticles();
  const allTags = Array.from(new Set(articles.flatMap(article => article.tags)));

  // This will be parsed and passed as props to the client component
  return { articles, allTags };
}