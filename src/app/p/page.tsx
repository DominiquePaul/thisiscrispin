import { getArticles } from '@/lib/contentful';
import ArticleList from '@/components/ArticleList';
import { Article } from '@/lib/types';
export default async function Posts() {
  const articles = await getArticles();
  
  // Group articles by tag
  const articlesByTag = articles.reduce<Record<string, Article[]>>((acc, article) => {
    article.tags.forEach(tag => {
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(article as Article);
    });
    return acc;
  }, {});

  return (
    <div>
      {Object.entries(articlesByTag).map(([tag, articles]) => (
        <ArticleList key={tag} tag={tag} articles={articles} />
      ))}
    </div>
  );
}