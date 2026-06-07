"use client";

import { useState } from "react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import NewPostDialog from './NewPostDialog'
import { useAuth } from '@/lib/AuthContext'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  createdAt: string
  coverImage?: string
  tags: string[]
  href?: string
}

interface BlogContentProps {
  articles: Article[]
  allTags?: string[]
  isTeaser?: boolean
  maxArticles?: number
}

export default function BlogContent({ articles, allTags = [], isTeaser = false, maxArticles = Infinity }: BlogContentProps) {
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const { isAuthenticated } = useAuth()

  // Map from tag ID to display name
  const getTagDisplayName = (tagId: string) => {
    const tagMap: Record<string, string> = {
      "devProjects": "Dev Projects",
      "web": "Web",
      "writing": "Writing",
      "design": "Design",
      "personal": "Personal",
      "hideOnThisiscrispin": "Hidden",
    };

    return tagMap[tagId] || tagId; // Fallback to tagId if no mapping exists
  }

  // Filter out the hideOnThisiscrispin tag for non-admins in dropdown
  const visibleTags = isAuthenticated
    ? allTags
    : allTags.filter(tag => tag !== "hideOnThisiscrispin")

  // Different filtering strategies for admin vs non-admin
  const filteredArticles = isAuthenticated
    ? (selectedTag === "all"
        ? articles
        : articles.filter(article => article.tags.includes(selectedTag)))
    : (selectedTag === "all"
        ? articles.filter(article => !article.tags.includes("hideOnThisiscrispin"))
        : articles.filter(article => article.tags.includes(selectedTag) && !article.tags.includes("hideOnThisiscrispin")))

  const displayedArticles = filteredArticles.slice(0, maxArticles)

  return (
    <div style={{ fontFamily: 'var(--font-jetbrains-mono)' }}>
      {!isTeaser && (
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl sm:text-5xl tracking-[-0.03em] text-[rgb(18,18,22)]">Posts</h1>
          <div className="flex items-center gap-3">
            <Select onValueChange={(value) => setSelectedTag(value)}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {visibleTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{getTagDisplayName(tag)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <NewPostDialog />
          </div>
        </header>
      )}

      <ul className="space-y-3">
        {displayedArticles.map((article) => (
          <li key={article.id}>
            <Link
              href={article.href ?? `/p/${article.slug}`}
              className="group flex items-baseline justify-between gap-6"
            >
              <span className="text-base text-[rgb(45,45,52)] transition-colors duration-200 group-hover:text-[#9A9A9A]">
                {article.title}
              </span>
              <span className="shrink-0 text-xs text-[#ADADAD]">
                {new Date(article.createdAt).getFullYear()}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
