"use client";

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'react-markdown-editor-lite/lib/index.css';

// Import the editor dynamically to avoid SSR issues
const MdEditor = dynamic(() => import('react-markdown-editor-lite'), {
  ssr: false,
});

interface MarkdownEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; width: number; height: number }>;
}

export default function MarkdownEditor({
  initialContent,
  onChange,
  onUploadImage
}: MarkdownEditorProps) {
  const [value, setValue] = useState<string>(initialContent || '');
  const [isClient, setIsClient] = useState(false);
  
  // Handle client-side only rendering
  useEffect(() => {
    setIsClient(true);
    
    // Add custom styles for a more minimal editor
    const style = document.createElement('style');
    style.innerHTML = `
      .full-width-editor {
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        max-width: 100vw;
        width: 100vw;
        position: relative;
      }
      .rc-md-editor {
        border: none !important;
        font-family: inherit !important;
        max-width: 100% !important;
      }
      .rc-md-navigation {
        background-color: transparent !important;
        border-bottom: 1px solid #eee !important;
        padding: 0 !important;
      }
      .rc-md-editor .editor-container {
        font-family: inherit !important;
        width: 100% !important;
      }
      .rc-md-editor .editor-container .sec-md {
        width: 50% !important;
        min-width: 50% !important;
        max-width: 50% !important;
      }
      .rc-md-editor .editor-container .sec-md .input {
        font-family: inherit !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      .rc-md-editor .editor-container .sec-html {
        width: 50% !important;
        min-width: 50% !important;
        max-width: 50% !important;
        border-left: 1px solid #eee !important;
        padding: 15px !important;
      }
      .custom-html-style {
        font-family: inherit !important;
        font-size: 14px !important;
        line-height: 1.5 !important;
      }
      .custom-html-style a {
        color: #0066cc !important;
        text-decoration: underline !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Initialize content from props
  useEffect(() => {
    if (typeof initialContent === "string") {
      setValue((prev) => (initialContent !== prev ? initialContent : prev));
    }
  }, [initialContent]);
  
  // Handle markdown rendering
  const renderMarkdown = (text: string) => {
    return (
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        className="custom-html-style"
        components={{
          a: ({node, ...props}) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          )
        }}
      >
        {text}
      </ReactMarkdown>
    );
  };
  
  // Handle change event
  const handleEditorChange = ({ text }: { text: string }) => {
    setValue(text);
    onChange(text);
  };
  
  // Handle image upload
  const handleImageUpload = async (file: File): Promise<string> => {
    if (!onUploadImage) {
      return '';
    }
    
    try {
      const result = await onUploadImage(file);
      return result.url;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return '';
    }
  };
  
  if (!isClient) {
    return <div className="min-h-[400px] animate-pulse bg-gray-100"></div>;
  }
  
  return (
    <div className="full-width-editor">
      <MdEditor
        value={value}
        style={{ height: '700px', width: '100%' }}
        onChange={handleEditorChange}
        renderHTML={renderMarkdown}
        placeholder="Start writing..."
        canView={{ menu: true, md: true, html: false, both: false, fullScreen: false, hideMenu: false }}
        imageAccept=".jpg,.jpeg,.png,.gif"
        onImageUpload={handleImageUpload}
        shortcuts={true}
        config={{
          view: {
            menu: true,
            md: true,
            html: true,
            both: false,
            fullScreen: false,
            hideMenu: false,
          },
          table: {
            maxRow: 5,
            maxCol: 6,
          },
        }}
      />
    </div>
  );
} 