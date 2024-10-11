import { Suspense } from "react"
import { getArticles } from '@/lib/contentful'
import BlogContent from '@/components/BlogContent'

export default async function BlogPage() {
  const articles = await getArticles()
  const allTags = Array.from(new Set(articles.flatMap(article => article.tags)))

  return (
    <div className="pt-8 px-8 md:px-16">
      <Suspense fallback={<div>Loading...</div>}>
        <BlogContent articles={articles} allTags={allTags} />
      </Suspense>
    </div>
  )
}