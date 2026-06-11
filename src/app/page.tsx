import HomeContent from '@/components/HomeContent';
import ArticleDataFetcher from '@/components/ArticleDataFetcher';
import PageViewTracker from '@/components/PageViewTracker';

// Force dynamic rendering - fetch fresh data on every request
export const dynamic = 'force-dynamic'

export default async function Home() {
  const { articles, allTags } = await ArticleDataFetcher();
  return (
    <>
      <PageViewTracker slug="home" />
      <HomeContent articles={articles} allTags={allTags} />
    </>
  );
}

