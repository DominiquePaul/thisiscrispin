"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import BlogPostEditButton from './BlogPostEditButton';

// Load ContentfulEditor with dynamic imports (client-side only)
const ContentfulEditor = dynamic(() => import('./ContentfulEditor'), {
  ssr: false
});

interface BlogPostClientProps {
  contentfulId: string;
  title: string;
  content: string;
  tags: string[];
}

export default function BlogPostClient({ 
  contentfulId, 
  title: initialTitle, 
  content: initialContent, 
  tags: initialTags 
}: BlogPostClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState(initialTags);
  
  // Update state when props change (in case content is reloaded)
  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
  }, [initialTitle, initialContent, initialTags]);
  
  const toggleEditing = () => {
    setIsEditing(!isEditing);
  };

  // Handle successful save from the editor
  const handleSaved = (newTitle: string, newContent: string, newTags: string[]) => {
    setTitle(newTitle);
    setContent(newContent);
    setTags(newTags);
    // We don't exit editing mode, so the user can continue editing
  };
  
  return (
    <>
      {/* Admin Edit Button */}
      <div className="mb-6 flex justify-end">
        <BlogPostEditButton 
          postId={contentfulId} 
          isEditing={isEditing}
          onToggleEdit={toggleEditing}
        />
      </div>
      
      {/* Editor (only for admins) */}
      {isEditing && (
        <div className="mb-16 border-b pb-8">
          <ContentfulEditor 
            contentfulId={contentfulId}
            initialContent={{
              title,
              mainContent: content
            }}
            initialTags={tags}
            onSaved={handleSaved}
          />
        </div>
      )}
    </>
  );
} 