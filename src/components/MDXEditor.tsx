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
  // Core state
  const [content, setContent] = useState(initialContent || '');
  const [isClient, setIsClient] = useState(false);
  const [editorPlugins, setEditorPlugins] = useState<any[]>([]);
  
  // Essential refs
  const editorRef = useRef<any>(null);
  const isInternalChange = useRef(false);
  
  // Debounced callbacks
  const debouncedOnChange = useRef(
    debounce((newContent: string) => {
      onChange(newContent);
    }, 500)
  ).current;

  // Set client-side rendering flag and add styles
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

  // Update content when initialContent prop changes
  useEffect(() => {
    // Only sync with initialContent when it changes from outside
    setContent(initialContent || '');
  }, [initialContent]);

  // Simplified content change handler
  const handleContentChange = useCallback((newContent: string) => {
    // Skip if no change
    if (newContent === content) return;
    
    // Mark as internal change to prevent loops
    isInternalChange.current = true;
    
    // For significant changes, update state immediately
    if (newContent.includes('![') || Math.abs(content.length - newContent.length) > 10) {
      setContent(newContent);
    }
    
    // Always debounce parent updates to prevent rerender cascade
    debouncedOnChange(newContent);
    
    // Reset internal change flag after a short delay
    setTimeout(() => {
      isInternalChange.current = false;
    }, 0);
  }, [content, debouncedOnChange]);

  // Insert image helper function
  const insertImageWithMarkdown = useCallback((url: string, altText: string = 'image') => {
    if (!url) return;
    
    // Create image markdown
    const imageMarkdown = `![${altText}](${url})`;
    
    // Insert image at the end of content with newlines
    const newContent = content ? `${content}\n\n${imageMarkdown}\n` : imageMarkdown;
    setContent(newContent);
    debouncedOnChange(newContent);
  }, [content, debouncedOnChange]);
  
  // Handle drag and drop for images
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    if (!onUploadImage) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) return;
    
    onUploadImage(file)
      .then(({ url }) => {
        if (url) {
          insertImageWithMarkdown(url, file.name.split('.')[0] || 'image');
        }
      })
      .catch(error => {
        console.error('Failed to upload dropped image:', error);
      });
  }, [onUploadImage, insertImageWithMarkdown]);
  
  // Load editor plugins
  useEffect(() => {
    const loadPlugins = async () => {
      if (isClient) {
        try {
          const mdx = await import('@mdxeditor/editor');
          
          // Create all plugins
          const plugins = [
            mdx.headingsPlugin({
              allowedHeadingLevels: [1, 2, 3, 4, 5, 6]
            }),
            mdx.listsPlugin(),
            mdx.quotePlugin(),
            mdx.thematicBreakPlugin(),
            mdx.markdownShortcutPlugin(),
            mdx.linkPlugin(),
            mdx.linkDialogPlugin(),
            mdx.imagePlugin({
              imageUploadHandler: async (file) => {
                if (!onUploadImage) return '';
                
                try {
                  const result = await onUploadImage(file);
                  
                  if (result && result.url) {
                    // For processing images, manually insert as fallback
                    if (result.status === 'unprocessed' || result.status === 'processed_unpublished' || result.status === 'processing') {
                      setTimeout(() => {
                        insertImageWithMarkdown(result.url, file.name);
                      }, 500);
                    }
                    return result.url;
                  }
                  return '';
                } catch (error) {
                  console.error("Error uploading image:", error);
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
  
  // Show loading state if not client-side or plugins not loaded
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