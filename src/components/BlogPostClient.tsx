"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BlogPostEditButton from './BlogPostEditButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import Image from 'next/image';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

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

// Load ContentfulEditor with dynamic imports (client-side only)
const ContentfulEditor = dynamic(() => import('./ContentfulEditor'), {
  ssr: false
});

interface BlogPostClientProps {
  contentfulId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export default function BlogPostClient({ 
  contentfulId, 
  title: initialTitle, 
  content: initialContent, 
  tags: initialTags,
  createdAt
}: BlogPostClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags);
  
  // Format date for display
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Update state when props change (in case content is reloaded)
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
  }, [initialTitle, initialContent, initialTags]);
  
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle cancellation of editing
  const handleCancel = () => {
    // Reset to the initial content if needed
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    setIsEditing(false);
  };

  // Handle successful save from the editor
  const handleSaved = (newTitle: string, newContent: string, newTags: string[]) => {
    setTitle(newTitle);
    setContent(newContent);
    setTags(newTags);
    setIsEditing(false); // Exit editing mode after successful save
  };
  
  return (
    <>
      {/* Admin Edit Button - only show when not editing */}
      {!isEditing && (
        <div className="mb-6 flex justify-end">
          <BlogPostEditButton 
            postId={contentfulId} 
            isEditing={isEditing}
            onToggleEdit={toggleEditing}
          />
        </div>
      )}
      
      {/* Editor (only for admins) */}
      {isEditing ? (
        <div className="mb-16 border-b pb-8">
          <ContentfulEditor 
            contentfulId={contentfulId}
            initialContent={{
              title,
              mainContent: content
            }}
            initialTags={tags}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* Render article content when not in editing mode */
        <article>
          <h1 className={`text-6xl font-bold mb-4 ${plexSans.className}`}>
            {title}
          </h1>
          <div className={`text-gray-400 mb-12 text-sm italic ${plexSans.className}`}>
            Published on {formattedDate}
          </div>
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
      )}
    </>
  );
} 