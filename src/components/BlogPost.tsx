import { createClient } from 'contentful';
import Image from 'next/image';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import BlogPostClient from './BlogPostClient';

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
});

const BlogPost: React.FC<{contentfulId: string}> = async ({ contentfulId }) => {
  try {
    const space = process.env.CONTENTFUL_PUBLIC_SPACE_ID;
    const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!space || !accessToken) {
      throw new Error('Contentful credentials not configured');
    }
    const client = createClient({ space, accessToken, environment: 'master' });

    const entry = await client.getEntry(contentfulId);
    const title = entry.fields.title as string;
    // `content` is now Contentful Rich Text (object)
    // JSON round-trip to ensure clean serialization across server/client boundary
    const content = JSON.parse(JSON.stringify(entry.fields.content)) as any;
    const excerpt = entry.fields.excerpt as string || '';
    const createdAt = entry.sys.createdAt; // Extract creation date
    
    // Extract coverImage if it exists
    let coverImage = undefined;
    if (entry.fields.coverImage) {
      const imageAsset = entry.fields.coverImage as any;
      coverImage = `https:${imageAsset.fields.file.url}`;
    }
    
    // Extract tags from metadata if available
    const tags = entry.metadata?.tags?.map(tag => tag.sys.id) || [];
    
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Client component for edit functionality */}
          <BlogPostClient 
            contentfulId={contentfulId} 
            title={title} 
            content={content} 
            tags={tags}
            createdAt={createdAt}
            coverImage={coverImage}
            excerpt={excerpt}
          />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching content from Contentful:', error);
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="border-l-4 border-red-500 text-red-700 p-4" role="alert">
            <p className="font-bold">Error</p>
            <p>{error instanceof Error ? error.message : 'Unknown error occurred'}</p>
          </div>
        </div>
      </div>
    );
  }
}

export default BlogPost;
