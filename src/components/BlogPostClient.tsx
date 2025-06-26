"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BlogPostEditButton from './BlogPostEditButton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
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
  content: string;
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
  const [content, setContent] = useState(initialContent);
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
  const handleSaved = (newTitle: string, newContent: string, newTags: string[], newCoverImage?: string, newExcerpt?: string) => {
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
              mainContent: content,
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                // Configure how elements are wrapped - prevents <div> inside <p> issues
                skipHtml={false}
                components={{
                  p: ({node, children, ...props}) => {
                    // Check if this paragraph contains only a video element
                    // This prevents wrapping videos in <p> tags which causes nesting issues
                    if (node && node.children.length === 1) {
                      const child = node.children[0];
                      if (child.type === 'element' && child.tagName === 'img') {
                        const imgSrc = child.properties?.src as string || '';
                        const isVideoFile = /\.(mp4|m4v|webm|ogg|mov)(\?.*)?$/i.test(imgSrc);
                        const isContentfulVideo = imgSrc.includes('ctfassets.net') && isVideoFile;
                        const isYouTube = imgSrc.includes('youtube.com') || imgSrc.includes('youtu.be');
                        const isVimeo = imgSrc.includes('vimeo.com');
                        
                        if (isVideoFile || isContentfulVideo || isYouTube || isVimeo) {
                          // Don't wrap videos in <p> tags - render children directly
                          return <>{children}</>;
                        }
                      }
                    }
                    // Regular paragraph
                    return <p {...props}>{children}</p>;
                  },
                  img: ({node, ...props}) => {
                    let imgSrc = props.src || '';
                    
                    // Check if it's a video file or video platform URL
                    const isVideoFile = /\.(mp4|m4v|webm|ogg|mov)(\?.*)?$/i.test(imgSrc);
                    const isContentfulVideo = imgSrc.includes('ctfassets.net') && isVideoFile;
                    const isYouTube = imgSrc.includes('youtube.com') || imgSrc.includes('youtu.be');
                    const isVimeo = imgSrc.includes('vimeo.com');
                    
                    // Only convert to video if using image syntax with video content
                    if (isVideoFile || isContentfulVideo || isYouTube || isVimeo) {
                      // Render as video instead of image
                      if (imgSrc.startsWith('//')) {
                        imgSrc = `https:${imgSrc}`;
                      }
                      return <VideoEmbed url={imgSrc} title={props.alt} />;
                    }
                    
                    // Handle different URL formats for images
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
                  a: ({node, ...props}) => {
                    // All links remain as regular links - no video embedding for link syntax
                    return <a {...props} className="text-blue-600 hover:text-blue-800 underline" />;
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