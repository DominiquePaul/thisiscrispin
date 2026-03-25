import { createClient, ContentfulClientApi } from 'contentful';
import { Article } from './types';

let _client: ContentfulClientApi<undefined> | null = null;

function getClient() {
  if (!_client) {
    const space = process.env.CONTENTFUL_PUBLIC_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!space || !accessToken) {
      throw new Error('Contentful credentials not configured');
    }
    _client = createClient({ space, accessToken, environment: 'master' });
  }
  return _client;
}

export async function getArticles(): Promise<Article[]> {
  try {
    const response = await getClient().getEntries({
      content_type: 'markdownrtc',
      order: ['-sys.createdAt'],
      include: 10, // Resolve up to 10 levels of linked entries/assets
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
    return [];
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const response = await getClient().getEntries({
      content_type: 'markdownrtc',
      'fields.slug': slug,
      limit: 1,
      include: 10, // Resolve up to 10 levels of linked entries/assets
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
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    return null;
  }
}