import HomeContent from '@/components/HomeContent';
import ArticleDataFetcher from '@/components/ArticleDataFetcher';

export default async function Home() {
  const { articles, allTags } = await ArticleDataFetcher();
  return <HomeContent articles={articles} allTags={allTags} />;
}

