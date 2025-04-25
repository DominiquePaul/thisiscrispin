"use client";

import { useState, useEffect } from 'react';
import MDXEditor from './MDXEditor';
import TagSelector from './TagSelector';
import { useAuth } from '@/lib/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { IBM_Plex_Sans } from 'next/font/google';
import Image from 'next/image';

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
    coverImage?: string;
  };
  initialTags: string[];
  onSaved?: (title: string, content: string, tags: string[], coverImage?: string) => void;
  onCancel?: () => void;
}

export default function ContentfulEditor({
  contentfulId,
  initialContent,
  initialTags = [],
  onSaved,
  onCancel
}: ContentfulEditorProps) {
  const [title, setTitle] = useState(initialContent.title || '');
  const [content, setContent] = useState(initialContent.mainContent || '');
  const [coverImage, setCoverImage] = useState(initialContent.coverImage || '');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  const { isAuthenticated } = useAuth();

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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Only image files are supported');
      }
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload the image with better error handling
      const response = await fetch('/api/contentful/asset', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error('Failed to upload image: ' + (errorData.error || response.statusText));
      }
      
      // Parse response data
      const data = await response.json();
      
      // Validate response structure
      if (!data || !data.asset || !data.asset.url) {
        throw new Error('Invalid response from server');
      }
      
      const asset = data.asset;
      
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
      // Show error message to user
      setMessage(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
      
      // Return a default response with an empty URL to prevent editor from breaking
      return { url: '', width: 0, height: 0 };
    }
  };
  
  // Handler for setting cover image
  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setMessage('Uploading cover image...');
      setMessageType('success');
      
      const result = await handleUploadImage(file);
      
      if (result.url) {
        setCoverImage(result.url);
        setMessage('Cover image uploaded successfully!');
      } else {
        setMessage('Failed to upload cover image.');
        setMessageType('error');
      }
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(`Error uploading cover image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    }
  };
  
  // Handler for removing cover image
  const handleRemoveCoverImage = () => {
    setCoverImage('');
    setMessage('Cover image removed.');
    setMessageType('success');
    setTimeout(() => setMessage(''), 3000);
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
      
      // Make a copy of the content to ensure it's properly saved
      const contentToSave = content;
      
      // Build fields object for update
      const fields: any = {
        title: title,
        mainContent: contentToSave
      };
      
      // Add coverImage if present
      if (coverImage) {
        // Create a reference to the asset
        // Note: This assumes the coverImage URL follows the Contentful format
        // and can be converted back to an asset ID
        const assetIdMatch = coverImage.match(/\/\/images\.ctfassets\.net\/[^/]+\/([^/]+)\//);
        if (assetIdMatch && assetIdMatch[1]) {
          fields.coverImage = {
            sys: {
              type: 'Link',
              linkType: 'Asset',
              id: assetIdMatch[1]
            }
          };
        }
      } else {
        // Set to null to remove the cover image if it was present before
        fields.coverImage = null;
      }
      
      // 1. Update content fields
      const contentResponse = await fetch('/api/contentful/entry', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entryId: contentfulId,
          fields: fields
        })
      });
      
      const contentResult = await contentResponse.json();
      
      if (!contentResponse.ok) {
        throw new Error('Failed to update content: ' + (contentResult.message || contentResponse.statusText));
      }
      
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
        throw new Error('Failed to update tags: ' + (tagsResult.message || tagsResponse.statusText));
      }
      
      // After successful save, preserve state and log again to verify
      setMessage('Changes saved successfully!');
      setMessageType('success');
      
      // Save the current state to component state to preserve after save
      // This ensures we don't lose data if the component re-renders
      setTitle(title);
      setContent(contentToSave); // Preserve the exact content we saved
      
      // Call the onSaved callback if provided
      if (onSaved) {
        onSaved(title, contentToSave, selectedTagIds, coverImage);
      }
      
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      setMessage('Failed to save changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Add a direct click handler function before the return statement
  const handleButtonClick = () => {
    // Call the save function
    handleSave().catch(error => {
      console.error('Error caught in save button handler:', error);
    });
  };

  // Modify the authentication check to show a helpful message instead of returning null
  if (!isAuthenticated) {
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
        {/* Cover Image Section */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Cover Image
          </label>
          {coverImage ? (
            <div className="relative">
              <div className="w-full relative aspect-[16/9] mb-4">
                <Image
                  src={coverImage}
                  alt="Cover Image"
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRemoveCoverImage}
                >
                  Remove Cover Image
                </Button>
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" type="button">
                    Replace Image
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
              <p className="text-gray-500 mb-4">No cover image selected</p>
              <label className="cursor-pointer">
                <Button variant="outline" size="sm" type="button">
                  Upload Cover Image
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
        
        {/* Title Section */}
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
        
        {/* Content Section */}
        <div className="space-y-2">
          <MDXEditor
            key={`editor-${contentfulId}`}
            initialContent={content}
            onChange={(newContent) => {
              setContent(newContent);
            }}
            onUploadImage={handleUploadImage}
          />
        </div>
        
        {/* Tags Section */}
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
      
      <div className="mt-6 flex justify-end space-x-4">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isSaving}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={handleButtonClick}
          disabled={isSaving}
          className="px-6"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 