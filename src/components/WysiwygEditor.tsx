"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TipTapImage from '@tiptap/extension-image';
import TipTapLink from '@tiptap/extension-link';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Bold, Italic, Link, Heading2, Heading3, 
  List, ListOrdered, Quote, Image, Code 
} from "lucide-react";

interface WysiwygEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onUploadImage?: (file: File) => Promise<{ url: string; width: number; height: number }>;
}

export default function WysiwygEditor({
  initialContent,
  onChange,
  onUploadImage
}: WysiwygEditorProps) {
  const [content, setContent] = useState(initialContent);
  const editorRef = useRef<any>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TipTapImage,
      TipTapLink.configure({
        openOnClick: false,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
      onChange(html);
    },
    // Fix for SSR hydration issues
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    // This fixes the SSR hydration mismatch error
    immediatelyRender: false,
  });
  
  // Store editor reference when it's available
  useEffect(() => {
    if (editor) {
      editorRef.current = editor;
    }
  }, [editor]);
  
  // Handle image upload
  const handleImageUpload = useCallback(async () => {
    if (!onUploadImage || !editorRef.current) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async () => {
      if (!input.files?.length) return;
      
      const file = input.files[0];
      
      // Show loading state
      const editor = editorRef.current;
      if (!editor) return;
      
      try {
        // Upload the image
        const { url, width, height } = await onUploadImage(file);
        
        // Insert the image into the editor
        editor.chain().focus().setImage({
          src: url,
          alt: file.name,
          width,
          height
        }).run();
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      }
    };
    
    input.click();
  }, [onUploadImage]);
  
  if (!editor) {
    return <div className="flex items-center justify-center h-40">Loading editor...</div>;
  }
  
  return (
    <TooltipProvider>
      <div className="border rounded-md overflow-hidden">
        {editor && (
          <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bg-white shadow-md rounded-md flex items-center p-1 gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('bold') ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('italic') ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={editor.isActive('link') ? "default" : "ghost"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const url = window.prompt('URL');
                      if (url) {
                        editor.chain().focus().setLink({ href: url }).run();
                      }
                    }}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Link</TooltipContent>
              </Tooltip>
            </div>
          </BubbleMenu>
        )}
        
        <div className="bg-muted p-2 border-b flex flex-wrap items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('heading', { level: 2 }) ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              >
                <Heading2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 2</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('heading', { level: 3 }) ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Heading 3</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('bulletList') ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
              >
                <List className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bullet List</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('orderedList') ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Numbered List</TooltipContent>
          </Tooltip>
          
          <Separator orientation="vertical" className="h-6" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('blockquote') ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
              >
                <Quote className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Quote</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleImageUpload}
              >
                <Image className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add Image</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editor.isActive('code') ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => editor.chain().focus().toggleCode().run()}
              >
                <Code className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Code</TooltipContent>
          </Tooltip>
        </div>
        
        <EditorContent editor={editor} className="p-4 min-h-[400px] prose prose-sm max-w-none focus:outline-none" />
        
        <div className="bg-muted/50 p-2 border-t text-xs text-muted-foreground flex items-center justify-center">
          Use markdown shortcuts: # for heading, {'>'} for quote, * for list, ``` for code
        </div>
      </div>
    </TooltipProvider>
  );
} 