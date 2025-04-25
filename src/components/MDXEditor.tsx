"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import '@mdxeditor/editor/style.css';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

// Setup fonts same as BlogPost.tsx
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
  const editorDomRef = useRef<HTMLDivElement | null>(null);
  const selectionStateRef = useRef<{
    start: number;
    end: number;
    hasFocus: boolean;
  }>({ start: 0, end: 0, hasFocus: false });
  
  // Debounced callbacks
  const debouncedOnChange = useRef(
    debounce((newContent: string) => {
      onChange(newContent);
    }, 500)
  ).current;

  // Capture selection and focus state
  const saveSelectionState = useCallback(() => {
    if (!editorDomRef.current) return;
    
    // Check if editor has focus
    const hasFocus = document.activeElement === editorDomRef.current || 
                    editorDomRef.current.contains(document.activeElement);
    
    // Get selection if available
    let start = 0;
    let end = 0;
    
    try {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (editorDomRef.current.contains(range.startContainer)) {
          // Store character offsets (simplified)
          start = range.startOffset;
          end = range.endOffset;
        }
      }
    } catch (e) {
      console.error('Error capturing selection', e);
    }
    
    selectionStateRef.current = { start, end, hasFocus };
  }, []);
  
  // Restore selection and focus
  const restoreSelectionState = useCallback(() => {
    const { hasFocus } = selectionStateRef.current;
    
    if (hasFocus && editorDomRef.current) {
      // Focus the editor
      setTimeout(() => {
        if (editorDomRef.current) {
          // Focus the editable element inside the editor
          const editableElement = editorDomRef.current.querySelector('[contenteditable=true]');
          if (editableElement) {
            (editableElement as HTMLElement).focus();
          }
        }
      }, 0);
    }
  }, []);

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
        font-size: 18px !important;
        line-height: 1.75 !important; /* Increased line height */
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .toolbar-group {
        border: none !important;
      }
      /* Base text styles */
      .mdxeditor p, 
      .mdxeditor a, 
      .mdxeditor li, 
      .mdxeditor blockquote {
        font-size: 16px !important;
        line-height: 1.75 !important; /* Increased line height */
        font-family: ${plexSans.style.fontFamily} !important;
        margin-bottom: 1.5em !important; /* Add more spacing between paragraphs */
      }
      /* Fix for consecutive paragraphs */
      .mdxeditor p + p {
        margin-top: -0.5em !important; /* Adjust top margin when paragraphs follow each other */
      }
      /* Source mode styling */
      .mdxeditor-source-view {
        font-size: 14px !important;
        line-height: 1.4 !important;
        font-family: ${plexMono.style.fontFamily} !important;
      }
      /* The actual pre/textarea where markdown source is displayed */
      .mdxeditor-source-view pre, 
      .mdxeditor-source-view textarea {
        font-size: 14px !important;
        line-height: 1.4 !important;
        font-family: ${plexMono.style.fontFamily} !important;
      }
      /* Code blocks use monospace font */
      .mdxeditor code {
        font-size: 16px !important;
        line-height: 1.5 !important;
        font-family: ${plexMono.style.fontFamily} !important;
      }
      /* Heading styles with consistent proportions */
      .mdxeditor h1 {
        font-size: 36px !important; 
        font-weight: 800 !important;
        margin-top: 1.5em !important;
        margin-bottom: 0.75em !important;
        line-height: 40px !important; 
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .mdxeditor h2 {
        font-size: 1.5rem !important; /* Match prose-md h2 size */
        font-weight: 600 !important;
        margin-top: 1.25em !important;
        margin-bottom: 0.6em !important;
        line-height: 1.3 !important;
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .mdxeditor h3 {
        font-size: 1.25rem !important; /* Match prose-md h3 size */
        font-weight: 600 !important;
        margin-top: 1em !important;
        margin-bottom: 0.5em !important;
        line-height: 1.4 !important;
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .mdxeditor h4 {
        font-size: 1.125rem !important; /* Match prose-md h4 size */
        font-weight: 600 !important;
        margin-top: 0.8em !important;
        margin-bottom: 0.4em !important;
        line-height: 1.4 !important;
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .mdxeditor h5 {
        font-size: 1rem !important; /* Match prose-md h5 size */
        font-weight: 600 !important;
        margin-top: 0.7em !important;
        margin-bottom: 0.35em !important;
        line-height: 1.4 !important;
        font-family: ${plexSans.style.fontFamily} !important;
      }
      .mdxeditor h6 {
        font-size: 0.875rem !important; /* Match prose-md h6 size */
        font-weight: 600 !important;
        margin-top: 0.6em !important;
        margin-bottom: 0.3em !important;
        line-height: 1.4 !important;
        font-family: ${plexSans.style.fontFamily} !important;
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
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [plexSans.style.fontFamily]);

  // Update content when initialContent prop changes
  useEffect(() => {
    // Only sync with initialContent when it changes from outside
    setContent(initialContent || '');
  }, [initialContent]);

  // Simplified content change handler
  const handleContentChange = useCallback((newContent: string) => {
    // Skip if no change
    if (newContent === content) return;
    
    // Save selection state before update
    saveSelectionState();
    
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
      // Restore selection state after update
      restoreSelectionState();
    }, 0);
  }, [content, debouncedOnChange, saveSelectionState, restoreSelectionState]);

  // Insert image helper function
  const insertImageWithMarkdown = useCallback((url: string, altText: string = 'image') => {
    if (!url) return;
    
    // Save selection state before update
    saveSelectionState();
    
    // Create image markdown
    const imageMarkdown = `![${altText}](${url})`;
    
    // Insert image at the end of content with newlines
    const newContent = content ? `${content}\n\n${imageMarkdown}\n` : imageMarkdown;
    setContent(newContent);
    debouncedOnChange(newContent);
    
    // Restore focus after insertion
    setTimeout(restoreSelectionState, 0);
  }, [content, debouncedOnChange, saveSelectionState, restoreSelectionState]);
  
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
  
  // Restore focus after renders
  useEffect(() => {
    restoreSelectionState();
  }, [content, restoreSelectionState]);
  
  // Connect DOM ref to editorDomRef
  const handleEditorRef = useCallback((node: HTMLDivElement | null) => {
    editorDomRef.current = node;
  }, []);
  
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
      ref={handleEditorRef}
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