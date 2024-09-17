import { createClient } from 'contentful';
import ReactMarkdown from 'react-markdown';

export default async function BlogPost() {
  try {
    const client = createClient({
      space: process.env.CONTENTFUL_PUBLIC_SPACE_ID!,
      accessToken: process.env.CONTENTFUL_ACCESS_TOKEN!,
      environment: 'master',
    });

    const entry = await client.getEntry('UB2adnuFkz807blYey7Kz');
    
    return (
      <div>
        <article>
          {entry.fields.mainContent ? (
            <ReactMarkdown>{entry.fields.mainContent as string}</ReactMarkdown>
          ) : (
            <div>No content available</div>
          )}
        </article>
      </div>
    );
  } catch (error) {
    console.error('Error fetching content from Contentful:', error);
    return <div>Error: {error instanceof Error ? error.message : 'Unknown error occurred'}</div>;
  }
}