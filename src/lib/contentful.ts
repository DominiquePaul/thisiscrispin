import { createClient } from 'contentful';
import { Article } from './types';
const client = createClient({
  space: process.env.CONTENTFUL_PUBLIC_SPACE_ID!,
  accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
  environment: 'master',
});

export async function getArticles(): Promise<Article[]> {
  // console.log("Fetching articles...");
  
  try {
    const response = await client.getEntries({
      content_type: 'markdownrtc',  // Update this line
      order: ['-sys.createdAt'],
    });

    // console.log("Response received:", JSON.stringify(response, null, 2));
    // console.log("Number of items:", response.items.length);
    
    // if (response.items.length > 0) {
    //   console.log("First item content type:", response.items[0].sys.contentType);
    //   console.log("First item fields:", JSON.stringify(response.items[0].fields, null, 2));
    // }

    return response.items.map(item => ({
      id: item.sys.id,
      title: item.fields.title as string,
      slug: item.fields.slug as string,
      tags: item.metadata.tags.map(tag => tag.sys.id),
    }));
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
  return {
    id: article.sys.id,
    title: article.fields.title,
    slug: article.fields.slug,
    content: article.fields.content,
    // ... other fields
  };
}