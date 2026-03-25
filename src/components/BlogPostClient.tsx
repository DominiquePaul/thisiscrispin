"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BlogPostEditButton from './BlogPostEditButton';
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types';
import Image from 'next/image';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import VideoEmbed from './VideoEmbed';

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
  // Contentful Rich Text document
  content: any;
  tags: string[];
  createdAt: string;
  coverImage?: string;
  excerpt?: string;
}

export default function BlogPostClient({ 
  contentfulId, 
  title: initialTitle, 
  content: initialContent, 
  tags: initialTags,
  createdAt,
  coverImage: initialCoverImage,
  excerpt: initialExcerpt
}: BlogPostClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<any>(initialContent);
  const [tags, setTags] = useState(initialTags);
  const [coverImage, setCoverImage] = useState(initialCoverImage);
  const [excerpt, setExcerpt] = useState(initialExcerpt || '');
  
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
    setCoverImage(initialCoverImage);
    setExcerpt(initialExcerpt || '');
  }, [initialTitle, initialContent, initialTags, initialCoverImage, initialExcerpt]);
  
  // Handle cancellation of editing
  const handleCancel = () => {
    // Reset to the initial content if needed
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    setCoverImage(initialCoverImage);
    setExcerpt(initialExcerpt || '');
    setIsEditing(false);
  };

  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle successful save from the editor
  const handleSaved = (newTitle: string, newContent: any, newTags: string[], newCoverImage?: string, newExcerpt?: string) => {
    setTitle(newTitle);
    setContent(newContent);
    setTags(newTags);
    if (newCoverImage) {
      setCoverImage(newCoverImage);
    }
    setExcerpt(newExcerpt || '');
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
              content: content,
              coverImage,
              excerpt
            }}
            initialTags={tags}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        /* Render article content when not in editing mode */
        <article>
          {coverImage && (
            <div className="w-full mb-8 relative aspect-[16/9]">
              <Image
                src={coverImage}
                alt={title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-cover rounded-md"
              />
            </div>
          )}
          <h1 className={`text-6xl font-bold mb-4 ${plexSans.className}`}>
            {title}
          </h1>
          <div className={`text-gray-400 mb-12 text-sm italic ${plexSans.className}`}>
            Published on {formattedDate}
          </div>
          <div className={`prose prose-md max-w-none ${plexSans.className}`}>
            {content ? (
              <>
                {documentToReactComponents(content, {
                  renderNode: {
                    [BLOCKS.EMBEDDED_ASSET]: (node) => {
                      try {
                        const { file, title: assetTitle, description } = node.data.target.fields;
                        const url = file?.['en-US']?.url || file?.url;

                        if (!url) return null;

                        const fullUrl = url.startsWith('//') ? `https:${url}` : url;
                        const isVideo = /\.(mp4|m4v|webm|ogg|mov)(\?.*)?$/i.test(fullUrl);

                        if (isVideo) {
                          return <VideoEmbed url={fullUrl} title={assetTitle?.['en-US'] || assetTitle || 'Video'} />;
                        }

                        const isGif = /\.(gif)(\?.*)?$/i.test(fullUrl);
                        const alt = description?.['en-US'] || assetTitle?.['en-US'] || description || assetTitle || '';

                        if (isGif) {
                          return (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={fullUrl}
                              alt={alt}
                              className="my-4 w-full h-auto"
                              style={{
                                maxWidth: '100%',
                                height: 'auto',
                              }}
                            />
                          );
                        }

                        return (
                          <Image
                            src={fullUrl}
                            width={1200}
                            height={0}
                            sizes="(max-width: 768px) 100vw, 800px"
                            style={{
                              width: '100%',
                              height: 'auto',
                            }}
                            alt={alt}
                            className="my-4"
                          />
                        );
                      } catch {
                        return null;
                      }
                    },
                    [BLOCKS.TABLE]: (node, children) => {
                      return (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full border-collapse border border-gray-300">
                            <tbody>{children}</tbody>
                          </table>
                        </div>
                      );
                    },
                    [BLOCKS.TABLE_ROW]: (node, children) => {
                      return <tr className="border-b border-gray-300">{children}</tr>;
                    },
                    [BLOCKS.TABLE_CELL]: (node, children) => {
                      return (
                        <td className="border border-gray-300 px-4 py-2">
                          {children}
                        </td>
                      );
                    },
                    [BLOCKS.TABLE_HEADER_CELL]: (node, children) => {
                      return (
                        <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
                          {children}
                        </th>
                      );
                    },
                    [INLINES.HYPERLINK]: (node, children) => {
                      const url = node.data.uri;
                      return (
                        <a href={url} className="text-blue-600 hover:text-blue-800 underline">
                          {children}
                        </a>
                      );
                    },
                    [BLOCKS.EMBEDDED_ENTRY]: (node) => {
                      // Prevent unhandled embedded entries from crashing the page
                      return null;
                    },
                    [INLINES.EMBEDDED_ENTRY]: (node) => {
                      return null;
                    },
                    [INLINES.ENTRY_HYPERLINK]: (node, children) => {
                      return <span>{children}</span>;
                    },
                    [INLINES.ASSET_HYPERLINK]: (node, children) => {
                      // Handle asset hyperlinks gracefully
                      try {
                        const url = node.data?.target?.fields?.file?.url;
                        if (url) {
                          const fullUrl = url.startsWith('//') ? `https:${url}` : url;
                          return (
                            <a href={fullUrl} className="text-blue-600 hover:text-blue-800 underline">
                              {children}
                            </a>
                          );
                        }
                      } catch {}
                      return <span>{children}</span>;
                    },
                  },
                  renderMark: {
                    [MARKS.CODE]: (text) => (
                      <code className={`${plexMono.className} bg-gray-100 rounded px-1`}>
                        {text}
                      </code>
                    ),
                  },
                })}
              </>
            ) : (
              <div className="text-gray-600">No content available</div>
            )}
          </div>
        </article>
      )}
    </>
  );
} 