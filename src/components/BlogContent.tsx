"use client";

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  createdAt: string
  coverImage?: string
  tags: string[]
}

interface BlogContentProps {
  articles: Article[]
  allTags?: string[]
  isTeaser?: boolean
  maxArticles?: number
}

export default function BlogContent({ articles, allTags = [], isTeaser = false, maxArticles = Infinity }: BlogContentProps) {
  const [selectedTag, setSelectedTag] = useState<string>("all")

  const filteredArticles = selectedTag === "all"
    ? articles.filter(article => !article.tags.includes("hideOnThisiscrispin"))
    : articles.filter(article => article.tags.includes(selectedTag) && !article.tags.includes("hideOnThisiscrispin"))


  const displayedArticles = filteredArticles.slice(0, maxArticles)

  return (
    <div className={`${isTeaser ? '' : 'mt-24'}`}>
      {!isTeaser && (
        <header className="mb-8">
          <h1 className="text-6xl font-bold mb-4">Posts</h1>
          <nav className="flex justify-between items-center">
            <Select onValueChange={(value) => setSelectedTag(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </nav>
        </header>
      )}

      <div>
        {displayedArticles.map((article) => (
          <Link href={`/p/${article.slug}`} key={article.id} className="block mb-8  border-b last:border-b-0 hover:bg-gray-200 transition-colors duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
                <h2 className="text-2xl font-bold mb-2">{article.title}</h2>
                <p className="text-gray-600 mb-2">{article.excerpt}</p>
                <p className="text-sm text-gray-500">
                  {new Date(article.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {/* Only render the image on larger screens */}
              {article.coverImage && (
                <div className="hidden md:w-[200px] md:h-[200px] relative md:block">
                  <Image
                    src={`${article.coverImage}?fm=webp&q=60`}
                    alt={article.title}
                    fill
                    sizes="200px"
                    className="object-cover rounded-sm"
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}