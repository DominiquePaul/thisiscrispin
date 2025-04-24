import { createClient } from 'contentful';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'; // Import rehype-raw
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
    const client = createClient({
      space: process.env.CONTENTFUL_PUBLIC_SPACE_ID!,
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
      environment: 'master',
    });

    const entry = await client.getEntry(contentfulId);
    const title = entry.fields.title as string;
    const content = entry.fields.mainContent as string;
    
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
          />
          
          <article>
            <h1 className={`text-6xl font-bold mb-16 ${plexSans.className}`}>
              {title}
            </h1>
            <div className={`prose prose-md max-w-none ${plexSans.className}`}>
              {content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]} 
                  components={{
                    img: ({node, ...props}) => {
                      let imgSrc = props.src || '';
                      // Handle different URL formats
                      if (imgSrc.startsWith('//')) {
                        imgSrc = `https:${imgSrc}`;
                      } else if (!imgSrc.startsWith('http://') && !imgSrc.startsWith('https://') && !imgSrc.startsWith('/')) {
                        imgSrc = `/${imgSrc}`;
                      }
                      
                      return (
                        <Image
                          {...props} 
                          src={imgSrc}
                          width={1200}
                          height={0}
                          sizes="(max-width: 768px) 100vw, 800px"
                          style={{
                            width: '100%',
                            height: 'auto',
                          }}
                          alt={props.alt || ''}
                          className="my-4"
                        />
                      );
                    },
                    code: ({node, ...props}) => (
                      <code className={`${plexMono.className} bg-gray-100 rounded px-1`} {...props} />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="text-gray-600">No content available</div>
              )}
            </div>
          </article>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching content from Contentful:', error);
    return (
      <div className="min-h-screen pt-20"> {/* Added pt-20 for top padding */}
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
