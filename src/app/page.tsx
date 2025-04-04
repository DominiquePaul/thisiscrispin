import HomeContent from '@/components/HomeContent';
import ArticleDataFetcher from '@/components/ArticleDataFetcher';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { articles, allTags } = await ArticleDataFetcher();
  return <HomeContent articles={articles} allTags={allTags} />;
}

