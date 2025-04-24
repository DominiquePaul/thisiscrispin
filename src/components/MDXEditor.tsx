"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import '@mdxeditor/editor/style.css';

// Dynamically import MDXEditor to avoid SSR issues
const MDXEditorComponent = dynamic(
  () => import('@mdxeditor/editor').then((mod) => mod.MDXEditor),
  { ssr: false }
);

interface MDXEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onUploadImage?: (file: File) => Promise<{ 
    url: string; 
    width: number; 
    height: number;
    status?: 'published' | 'unprocessed' | 'processed_unpublished' | 'processing';
  }>;
}

export default function MDXEditor({
  initialContent,
  onChange,
  onUploadImage
}: MDXEditorProps) {
  console.log("📌 MDXEditor rendered with onUploadImage handler:", !!onUploadImage);

  const [content, setContent] = useState(initialContent || '');
  const [isClient, setIsClient] = useState(false);
  const [editorPlugins, setEditorPlugins] = useState<any[]>([]);
  const contentRef = useRef(initialContent || '');
  const uploadedImages = useRef<Map<string, string>>(new Map());
  const editorRef = useRef<any>(null);

  // Sync the content ref with the state for logging purposes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Set client-side rendering flag
  useEffect(() => {
    setIsClient(true);
    
    // Add custom styles
    const style = document.createElement('style');
    style.innerHTML = `
      .mdxeditor-container {
        border: 1px solid #e5e7eb !important;
        border-radius: 0.375rem !important;
        font-family: inherit !important;
      }
      .mdxeditor {
        padding: 1rem !important;
        min-height: 500px !important;
      }
      .toolbar-group {
        border: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Update the effect that sets the initial content
  useEffect(() => {
    // Only update content from initialContent when the editor first mounts
    // or when initialContent changes from outside
    console.log('initialContent changed to:', initialContent);
    setContent(initialContent || '');
    contentRef.current = initialContent || '';
  }, [initialContent]);

  // Add a new useEffect that will update the editor's markdown when content changes externally
  // This should be placed near the other useEffect hooks
  useEffect(() => {
    // This ref helps us avoid infinite loops by tracking whether the change
    // was from us or externally
    const isInitialRender = contentRef.current !== content;
    
    if (editorRef.current && isInitialRender) {
      console.log('Updating editor markdown from external change', { 
        current: contentRef.current, 
        new: content
      });
      
      // Update the editor's content directly
      if (typeof editorRef.current.setMarkdown === 'function') {
        editorRef.current.setMarkdown(content);
      }
      
      // Update our ref
      contentRef.current = content;
    }
  }, [content]);

  // Custom implementation for manually inserting an image with markdown
  const insertImageWithMarkdown = useCallback((url: string, altText: string = 'image', status?: string) => {
    if (!url) return;
    
    console.log('Manually inserting image with markdown:', url, status ? `(status: ${status})` : '');
    
    // Create image markdown
    const imageMarkdown = `![${altText}](${url})`;
    
    // Insert at cursor position or append to end if we can't determine position
    try {
      // For direct markdown manipulation, append to current content with a newline
      const newContent = content ? `${content}\n\n${imageMarkdown}\n` : imageMarkdown;
      setContent(newContent);
      onChange(newContent);
      console.log('Image inserted with markdown:', imageMarkdown);
      
      // If the image is still processing, setup polling to check for the final URL
      if (status === 'processing') {
        console.log('Image is still processing, will poll for updates');
      }
    } catch (error) {
      console.error('Error inserting image:', error);
    }
  }, [content, onChange]);
  
  // Handle Drag & Drop for images - useful feature
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!onUploadImage) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    
    console.log('Image dropped into editor, uploading:', file.name);
    onUploadImage(file)
      .then(({ url, status }) => {
        if (url) {
          console.log('Successfully uploaded dropped image:', url, status ? `(status: ${status})` : '');
          insertImageWithMarkdown(url, file.name.split('.')[0] || 'image', status);
        }
      })
      .catch(error => {
        console.error('Failed to upload dropped image:', error);
      });
  }, [onUploadImage, insertImageWithMarkdown]);
  
  // Load plugins
  useEffect(() => {
    const loadPlugins = async () => {
      console.log("📌 Loading MDXEditor plugins, onUploadImage available:", !!onUploadImage);
      
      if (isClient) {
        try {
          const mdx = await import('@mdxeditor/editor');
          
          // Create a safe image upload handler for MDXEditor
          const safeImageUploadHandler = async (image: File): Promise<string> => {
            console.log("📌 MDXEditor image upload handler called for file:", image.name);
            
            if (!onUploadImage) {
              console.warn('No image upload handler provided to MDXEditor');
              return Promise.resolve('');
            }
            
            try {
              console.log('Starting image upload process for:', image.name, `(${image.size} bytes)`);
              
              // Wrap in try-catch to ensure we never reject
              const result = await onUploadImage(image).catch(error => {
                console.error('Image upload rejected:', error);
                return { url: '', width: 0, height: 0 };
              });
              
              // Validate the result
              if (result && typeof result.url === 'string' && result.url) {
                console.log('Successfully uploaded image, URL:', result.url);
                const finalUrl = result.url;
                
                // Track the uploaded image
                uploadedImages.current.set(image.name, finalUrl);
                console.log('Tracking uploaded image:', image.name, finalUrl);
                
                // For images uploaded via the plugin that don't appear correctly,
                // we'll manually insert them as a fallback
                setTimeout(() => {
                  const currentContent = contentRef.current;
                  console.log('Current content chars after upload:', currentContent.length);
                  
                  // Check if the image URL is already in the content
                  if (!currentContent.includes(finalUrl)) {
                    console.log('Image URL not found in content, manually inserting');
                    insertImageWithMarkdown(finalUrl, image.name.split('.')[0] || 'image');
                  }
                }, 500);
                
                return finalUrl;
              }
              
              console.error('Invalid upload result format:', result);
              return '';
            } catch (error) {
              console.error('Failed to upload image:', error);
              return '';
            }
          };
          
          // Create all plugins
          const plugins = [
            mdx.headingsPlugin(),
            mdx.listsPlugin(),
            mdx.quotePlugin(),
            mdx.thematicBreakPlugin(),
            mdx.markdownShortcutPlugin(),
            mdx.linkPlugin(),
            mdx.linkDialogPlugin(),
            // Configure image plugin differently to avoid the error
            mdx.imagePlugin({
              imageUploadHandler: async (file) => {
                console.log("🟢 Direct imageUploadHandler called with file:", file.name);
                
                if (!onUploadImage) {
                  console.error('No onUploadImage handler provided!');
                  return '';
                }
                
                try {
                  console.log("🟢 Calling onUploadImage function");
                  const result = await onUploadImage(file);
                  console.log("🟢 Upload result:", result);
                  
                  if (result && result.url) {
                    console.log("🟢 Successfully uploaded image, returning URL:", result.url);
                    
                    // Check if the asset is still processing
                    if (result.status === 'unprocessed' || result.status === 'processed_unpublished' || result.status === 'processing') {
                      console.log("🟢 Asset is still processing. Adding to content anyway.");
                      
                      // Insert the image directly into the content as a fallback
                      setTimeout(() => {
                        if (contentRef.current && !contentRef.current.includes(result.url)) {
                          console.log("🟢 Manually inserting image as fallback");
                          insertImageWithMarkdown(result.url, file.name, result.status);
                        }
                      }, 500);
                    }
                    
                    return result.url;
                  } else {
                    console.error("🟢 Invalid upload result:", result);
                    return '';
                  }
                } catch (error) {
                  console.error("🟢 Error in upload:", error);
                  return '';
                }
              }
            }),
            mdx.codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
            mdx.diffSourcePlugin(),
            mdx.toolbarPlugin({
              toolbarContents: () => (
                <div className="flex flex-wrap items-center gap-1 p-1">
                  <mdx.BlockTypeSelect />
                  <mdx.Separator />
                  <mdx.BoldItalicUnderlineToggles />
                  <mdx.CodeToggle />
                  <mdx.Separator />
                  <mdx.ListsToggle />
                  <mdx.Separator />
                  <mdx.CreateLink />
                  <mdx.InsertImage />
                  <mdx.Separator />
                  <mdx.InsertCodeBlock />
                  <mdx.InsertThematicBreak />
                  <mdx.Separator />
                  <mdx.DiffSourceToggleWrapper>
                    Show source
                  </mdx.DiffSourceToggleWrapper>
                </div>
              )
            }),
          ];
          
          setEditorPlugins(plugins);
        } catch (error) {
          console.error('Failed to load MDXEditor plugins:', error);
        }
      }
    };
    
    loadPlugins();
  }, [isClient, onUploadImage, insertImageWithMarkdown]);
  
  // Handle content update with image persistence
  const handleContentChange = (newContent: string) => {
    console.log('Content changed:', { 
      oldLength: content.length, 
      newLength: newContent.length,
      hasImagesOld: content.includes('!['),
      hasImagesNew: newContent.includes('![')
    });
    
    // Check for image markdown syntax
    if (newContent.includes('![') && newContent !== content) {
      console.log('Content updated with images:', newContent.substring(0, 100) + '...');
      
      // Ensure uploaded images are properly referenced
      let processedContent = newContent;
      
      // Log all tracked images
      if (uploadedImages.current.size > 0) {
        console.log('Checking tracked images against content:', 
          [...uploadedImages.current.entries()]);
      }
    }
    
    setContent(newContent);
    onChange(newContent);
  };
  
  // Add debugging for re-renders
  useEffect(() => {
    console.log('MDXEditor rendered/re-rendered', {
      contentLength: content.length,
      hasImages: content.includes('!['),
      editorPluginsLoaded: editorPlugins.length > 0
    });
    
    // Extract image URLs from content for debugging
    if (content.includes('![')) {
      const imageRegex = /!\[.*?\]\((.*?)\)/g;
      const matches = [...content.matchAll(imageRegex)];
      const imageUrls = matches.map(match => match[1]);
      console.log('Current content contains images:', imageUrls);
    }
  }, [content, editorPlugins]);
  
  if (!isClient || editorPlugins.length === 0) {
    return <div className="animate-pulse bg-gray-100 rounded-md h-[500px] w-full"></div>;
  }
  
  return (
    <div 
      className="mdx-editor-wrapper w-full" 
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <MDXEditorComponent
        ref={editorRef}
        key={`mdx-editor-${initialContent.substring(0, 20)}`}
        markdown={content}
        onChange={handleContentChange}
        plugins={editorPlugins}
        className="w-full rounded-md"
      />
    </div>
  );
} 