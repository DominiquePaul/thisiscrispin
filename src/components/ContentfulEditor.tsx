"use client";

import { useState, useEffect } from 'react';
import MDXEditor from './MDXEditor';
import TagSelector from './TagSelector';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ContentDebugger from './ContentDebugger';
import { IBM_Plex_Sans } from 'next/font/google';

const plexSans = IBM_Plex_Sans({ 
  subsets: ['latin'],
  weight: ['400', '600'],
  display: 'swap',
});

interface Tag {
  id: string;
  name: string;
}

interface ContentfulEditorProps {
  contentfulId: string;
  initialContent: {
    title: string;
    mainContent: string;
  };
  initialTags: string[];
  onSaved?: (title: string, content: string, tags: string[]) => void;
}

export default function ContentfulEditor({
  contentfulId,
  initialContent,
  initialTags = [],
  onSaved
}: ContentfulEditorProps) {
  const [title, setTitle] = useState(initialContent.title || '');
  const [content, setContent] = useState(initialContent.mainContent || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const { isAuthenticated } = useAuth();

  // Debug state changes
  useEffect(() => {
    console.log('ContentfulEditor content changed:', {
      contentLength: content.length,
      hasImages: content.includes('!['),
      title
    });
  }, [content, title]);

  // Debug initialization
  useEffect(() => {
    console.log('ContentfulEditor initialized with:', {
      initialTitle: initialContent.title,
      initialContentLength: initialContent.mainContent.length,
      hasInitialImages: initialContent.mainContent.includes('![')
    });
  }, []);

  // Fetch available tags when component mounts
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchTags = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/contentful/tags');
        
        if (!response.ok) {
          throw new Error('Failed to fetch tags');
        }
        
        const data = await response.json();
        setAvailableTags(data.tags || []);
      } catch (error) {
        console.error('Error fetching tags:', error);
        setMessage('Failed to fetch tags. Please refresh the page.');
        setMessageType('error');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTags();
  }, [isAuthenticated]);
  
  // Add authentication debugging to the start of the component
  useEffect(() => {
    console.log('ContentfulEditor authentication status:', isAuthenticated);
  }, [isAuthenticated]);
  
  // Handler for creating new tags
  const handleCreateTag = async (name: string): Promise<Tag> => {
    const response = await fetch('/api/contentful/tags', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });
    
    if (!response.ok) {
      throw new Error('Failed to create tag');
    }
    
    const data = await response.json();
    
    // Add the new tag to available tags
    setAvailableTags(prevTags => [...prevTags, data.tag]);
    
    return data.tag;
  };
  
  // Handler for uploading images
  const handleUploadImage = async (file: File) => {
    try {
      console.log('🔴 IMAGE UPLOAD STARTED', { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported');
      }
      
      console.log(`Starting upload for ${file.name} (${file.size} bytes, ${file.type})`);
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the request details
      console.log('🔴 SENDING API REQUEST to /api/contentful/asset');
      
      // Upload the image with better error handling
      const response = await fetch('/api/contentful/asset', {
        method: 'POST',
        body: formData
      });
      
      console.log('🔴 RECEIVED API RESPONSE', { 
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Image upload failed:', errorData);
        throw new Error('Failed to upload image: ' + (errorData.error || response.statusText));
      }
      
      // Parse response data
      const data = await response.json();
      
      // Validate response structure
      if (!data || !data.asset || !data.asset.url) {
        console.error('Invalid response from image upload endpoint:', data);
        throw new Error('Invalid response from server');
      }
      
      const asset = data.asset;
      console.log('🔴 SUCCESSFULLY UPLOADED IMAGE:', asset);
      
      // Show temporary success message
      setMessage(`Image "${file.name}" uploaded successfully!`);
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
      
      // Return asset data for the editor
      return {
        url: asset.url,
        width: asset.width || 0,
        height: asset.height || 0
      };
    } catch (error) {
      console.error('🔴 ERROR IN UPLOAD:', error);
      
      // Show error message to user
      setMessage(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      
      // Return a default response with an empty URL to prevent editor from breaking
      return { url: '', width: 0, height: 0 };
    }
  };
  
  // Handler for saving changes
  const handleSave = async () => {
    if (!title.trim()) {
      setMessage('Title is required');
      setMessageType('error');
      return;
    }
    
    try {
      setIsSaving(true);
      setMessage('Saving changes...');
      
      console.log('Current content state before save:', content);
      console.log('Current title before save:', title);
      
      // Check if content includes images
      const hasImages = content.includes('![');
      if (hasImages) {
        console.log('Content contains images, ensuring proper format before save');
        const imageMatches = content.match(/!\[.*?\]\((.*?)\)/g);
        console.log('Found image references:', imageMatches);
        
        // Store image references for later verification
        const imageUrlsFound = imageMatches?.map(match => {
          const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
          return urlMatch?.[1] || '';
        }) || [];
        console.log('Image URLs found:', imageUrlsFound);
      }
      
      // Make a copy of the content to ensure it's properly saved
      const contentToSave = content;
      
      // 1. Update content fields
      const contentResponse = await fetch('/api/contentful/entry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryId: contentfulId,
          fields: {
            title: title,
            mainContent: contentToSave
          }
        })
      });
      
      const contentResult = await contentResponse.json();
      
      if (!contentResponse.ok) {
        console.error('Content update failed:', contentResult);
        throw new Error('Failed to update content: ' + (contentResult.message || contentResponse.statusText));
      }
      
      console.log('Content updated successfully:', contentResult);
      
      // 2. Update tags
      const tagsResponse = await fetch('/api/contentful/tags', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryId: contentfulId,
          tagIds: selectedTagIds
        })
      });
      
      if (!tagsResponse.ok) {
        const tagsResult = await tagsResponse.json().catch(() => ({}));
        console.error('Tags update failed:', tagsResult);
        throw new Error('Failed to update tags: ' + (tagsResult.message || tagsResponse.statusText));
      }
      
      // After successful save, preserve state and log again to verify
      setMessage('Changes saved successfully!');
      setMessageType('success');
      
      // Save the current state to component state to preserve after save
      // This ensures we don't lose data if the component re-renders
      setTitle(title);
      setContent(contentToSave); // Preserve the exact content we saved
      
      console.log('State preserved after save:', {
        titleLength: title.length,
        contentLength: contentToSave.length,
        hasImages: contentToSave.includes('![')
      });
      
      // Call the onSaved callback if provided
      if (onSaved) {
        onSaved(title, contentToSave, selectedTagIds);
      }
      
      // Don't reload the page - this preserves the editor state with images
      setTimeout(() => {
        setMessage('');
        
        // Verify content still has images after timeout
        if (hasImages) {
          console.log('Verifying content still has images after save timeout');
          console.log('Current content contains image markdown:', content.includes('!['));
        }
      }, 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setMessage('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add a direct click handler function before the return statement
  const handleButtonClick = () => {
    console.log('Save button clicked');
    console.log('Current state:', { 
      title: title.length > 0 ? title.substring(0, 20) + '...' : '(empty)', 
      contentLength: content.length,
      hasImages: content.includes('!['),
      authenticated: isAuthenticated
    });
    
    // Call the save function
    handleSave().catch(error => {
      console.error('Error caught in save button handler:', error);
    });
  };

  // Modify the authentication check to show a helpful message instead of returning null
  if (!isAuthenticated) {
    console.log('Authentication check failed - not showing editor');
    return (
      <div className="my-8 p-6 border border-red-300 bg-red-50 rounded-md">
        <h2 className="text-lg font-medium text-red-800 mb-2">Authentication Required</h2>
        <p className="text-red-700">
          You must be logged in as an admin to edit content. 
          If you believe you should be authenticated, try refreshing the page.
        </p>
      </div>
    );
  }
  
  return (
    <div className="my-8">
      {message && (
        <Alert variant={messageType === 'success' ? 'default' : 'destructive'} className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <div className={plexSans.className}>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-6xl font-bold border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 mb-16 w-full h-auto py-0"
              placeholder="Title"
              style={{ fontSize: '60px', lineHeight: '60px' }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <MDXEditor
            key={`editor-${contentfulId}-${content.length}`}
            initialContent={content}
            onChange={(newContent) => {
              console.log('MDXEditor onChange called with content length:', newContent.length);
              console.log('Current content state before update:', content.length);
              
              // Check for image markdown to ensure we don't lose them
              const hadImages = content.includes('![');
              const hasImages = newContent.includes('![');
              
              if (hadImages && !hasImages) {
                console.warn('Image markdown was removed during update - this may indicate a problem');
              }
              
              if (!hadImages && hasImages) {
                console.log('New image added to content');
              }
              
              setContent(newContent);
            }}
            onUploadImage={handleUploadImage}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Tags
          </label>
          {isLoading ? (
            <p className="text-muted-foreground">Loading tags...</p>
          ) : (
            <TagSelector
              selectedTags={selectedTagIds}
              onChange={setSelectedTagIds}
              availableTags={availableTags}
              onCreateTag={handleCreateTag}
            />
          )}
        </div>
      </div>
      
      <div className="mt-6 text-right">
        <Button
          onClick={handleButtonClick}
          disabled={isSaving}
          className="px-6"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
      
      <ContentDebugger content={content} title={title} />
    </div>
  );
} 