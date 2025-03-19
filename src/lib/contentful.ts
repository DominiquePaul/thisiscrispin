import { createClient } from 'contentful';
import { Article } from './types';
const client = createClient({
  space: process.env.CONTENTFUL_PUBLIC_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
  environment: 'master',
});

export async function getArticles(): Promise<Article[]> {
  try {
    const response = await client.getEntries({
      content_type: 'markdownrtc',
      order: ['-sys.createdAt'],
    });

    const articles = response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title as string,
      createdAt: item.sys.createdAt,
      slug: item.fields.slug as string,
      coverImage: item.fields.coverImage 
        ? `https:${(item.fields.coverImage as any).fields.file.url}`
        : undefined,
      excerpt: item.fields.excerpt as string,
      tags: item.metadata.tags.map(tag => tag.sys.id),
    }));


    return articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }
}

export async function getArticleBySlug(slug: string) {
  const response = await client.getEntries({
    content_type: 'markdownrtc',
    'fields.slug': slug,
    limit: 1,
  });

  if (response.items.length === 0) {
    return null;
  }

  const article = response.items[0];
  const articleData = {
    id: article.sys.id,
    createdAt: article.sys.createdAt,
    slug: article.fields.slug,
    title: article.fields.title,
    excerpt: article.fields.excerpt,
    coverImage: article.fields.coverImage 
      ? `https:${(article.fields.coverImage as any).fields.file.url}`
      : '/default-cover-image.jpg',
    content: article.fields.content,
  };

  return articleData;
}