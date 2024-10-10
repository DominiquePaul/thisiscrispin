import { createClient } from 'contentful';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const BlogPost: React.FC<{contentfulId: string}> = async ({ contentfulId }) => {
  try {
    const client = createClient({
      space: process.env.CONTENTFUL_PUBLIC_SPACE_ID!,
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
      environment: 'master',
    });

    const entry = await client.getEntry(contentfulId);
    
    return (
      <div className="min-h-screen pt-20"> {/* Added pt-20 for top padding */}
        <div className="max-w-3xl mx-auto px-4 py-8">
          <article>
            <h1 className="text-3xl font-bold mb-4">{entry.fields.title as string}</h1>
            <div className="prose max-w-none">
              {entry.fields.mainContent ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                >
                  {entry.fields.mainContent as string}
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