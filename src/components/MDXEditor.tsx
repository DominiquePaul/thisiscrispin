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

// Debounce helper function
const debounce = (fn: Function, ms = 300) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

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
  const internalChange = useRef(false);

  // Create a debounced version of onChange
  const debouncedOnChange = useRef(
    debounce((newContent: string) => {
      onChange(newContent);
    }, 500)
  ).current;

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
        font-size: 16px !important;
        line-height: 1.5 !important;
      }
      .toolbar-group {
        border: none !important;
      }
      /* Base text styles */
      .mdxeditor p, 
      .mdxeditor a, 
      .mdxeditor li, 
      .mdxeditor blockquote,
      .mdxeditor code {
        font-size: 16px !important;
        line-height: 1.5 !important;
      }
      /* Heading styles with consistent proportions */
      .mdxeditor h1 {
        font-size: 2em !important; /* 32px at base 16px */
        font-weight: 700 !important;
        margin-top: 1.5em !important;
        margin-bottom: 0.75em !important;
        line-height: 1.2 !important;
      }
      .mdxeditor h2 {
        font-size: 1.75em !important; /* 28px at base 16px */
        font-weight: 600 !important;
        margin-top: 1.25em !important;
        margin-bottom: 0.6em !important;
        line-height: 1.3 !important;
      }
      .mdxeditor h3 {
        font-size: 1.5em !important; /* 24px at base 16px */
        font-weight: 600 !important;
        margin-top: 1em !important;
        margin-bottom: 0.5em !important;
        line-height: 1.4 !important;
      }
      .mdxeditor h4 {
        font-size: 1.25em !important; /* 20px at base 16px */
        font-weight: 600 !important;
        margin-top: 0.8em !important;
        margin-bottom: 0.4em !important;
        line-height: 1.4 !important;
      }
      .mdxeditor h5 {
        font-size: 1.125em !important; /* 18px at base 16px */
        font-weight: 600 !important;
        margin-top: 0.7em !important;
        margin-bottom: 0.35em !important;
        line-height: 1.4 !important;
      }
      .mdxeditor h6 {
        font-size: 1em !important; /* 16px at base 16px */
        font-weight: 600 !important;
        margin-top: 0.6em !important;
        margin-bottom: 0.3em !important;
        line-height: 1.4 !important;
      }
      /* Ensure links are distinct */
      .mdxeditor a {
        color: #2563eb !important;
        text-decoration: underline !important;
      }
      /* Ensure lists are consistent */
      .mdxeditor ul, .mdxeditor ol {
        padding-left: 2em !important;
        margin: 0.5em 0 !important;
      }
      /* Ensure blockquotes are consistent */
      .mdxeditor blockquote {
        border-left: 4px solid #e5e7eb !important;
        padding-left: 1em !important;
        margin-left: 0 !important;
        font-style: italic !important;
      }
      /* Ensure code blocks are consistent */
      .mdxeditor pre {
        background-color: #f3f4f6 !important;
        padding: 0.75em !important;
        border-radius: 0.375rem !important;
        overflow-x: auto !important;
      }
      .mdxeditor code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        font-size: 0.9em !important;
        background-color: rgba(0, 0, 0, 0.05) !important;
        padding: 0.2em 0.4em !important;
        border-radius: 0.25em !important;
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

  // Handle content update with image persistence
  const handleContentChange = (newContent: string) => {
    // Skip processing if content hasn't changed
    if (newContent === content) {
      return;
    }
    
    // Update internal reference immediately for internal tracking
    contentRef.current = newContent;
    internalChange.current = true;
    
    // Only update state if there's significant change (like image additions)
    if (newContent.includes('![') && newContent !== content) {
      console.log('Content updated with images:', newContent.substring(0, 100) + '...');
      
      // Log all tracked images
      if (uploadedImages.current.size > 0) {
        console.log('Checking tracked images against content:', 
          [...uploadedImages.current.entries()]);
      }
      
      // Update state for significant changes immediately
      setContent(newContent);
    } else {
      // For regular typing, we'll update the contentRef but delay the state update
      // This prevents constant rerenders while typing
      setContent(prevContent => {
        // Only update if the content has significantly changed
        if (Math.abs(prevContent.length - newContent.length) > 10) {
          return newContent;
        }
        return prevContent;
      });
    }
    
    // Always use debounced onChange for parent component updates
    debouncedOnChange(newContent);
  };
  
  // Add a useEffect to handle the internalChange flag reset
  useEffect(() => {
    // After the content has been updated and rendered, we can safely reset the flag
    if (internalChange.current && content === contentRef.current) {
      // Use RAF to ensure we're outside of React's reconciliation cycle
      requestAnimationFrame(() => {
        internalChange.current = false;
      });
    }
  }, [content]);
  
  // Modify the existing useEffect that watches content changes
  useEffect(() => {
    // Only update the editor when content changes from an external source (not from typing in the editor)
    if (editorRef.current && !internalChange.current && content !== contentRef.current) {
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
      contentRef.current = newContent;
      debouncedOnChange(newContent);
      console.log('Image inserted with markdown:', imageMarkdown);
      
      // If the image is still processing, setup polling to check for the final URL
      if (status === 'processing') {
        console.log('Image is still processing, will poll for updates');
      }
    } catch (error) {
      console.error('Error inserting image:', error);
    }
  }, [content, debouncedOnChange]);
  
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
            mdx.headingsPlugin({
              allowedHeadingLevels: [1, 2, 3, 4, 5, 6] // Ensure all heading levels are supported
            }),
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
        key="mdx-editor-instance"
        markdown={content}
        onChange={handleContentChange}
        plugins={editorPlugins}
        className="w-full rounded-md"
        contentEditableClassName="prose prose-base max-w-none"
      />
    </div>
  );
} 