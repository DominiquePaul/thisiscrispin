"use client";

import { useState, useEffect, useRef } from 'react';
import { MDXEditor, MDXEditorMethods, imagePlugin } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { Button } from '@/components/ui/button';

export default function DirectEditorTest() {
  const [content, setContent] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const editorRef = useRef<MDXEditorMethods>(null);

  // Only render on client side
  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleImageUpload = async (file: File): Promise<string> => {
    console.log('Direct handler called with file:', file.name);
    
    try {
      // Use our test route
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Upload result:', data);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      if (data.asset?.url) {
        setUploadResult(data.asset.url);
        return data.asset.url;
      }
      
      return '';
    } catch (error) {
      console.error('Image upload error:', error);
      return '';
    }
  };

  if (!loaded) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-4">Direct MDXEditor Test</h1>
      
      <div className="mb-6 border rounded-md">
        <MDXEditor
          ref={editorRef}
          markdown={content}
          onChange={setContent}
          plugins={[
            imagePlugin({
              imageUploadHandler: handleImageUpload
            })
          ]}
        />
      </div>
      
      {uploadResult && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Last Uploaded Image:</h2>
          <img 
            src={uploadResult} 
            alt="Uploaded" 
            className="max-w-md border rounded-md"
          />
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Current Content:</h2>
        <pre className="bg-gray-100 p-4 rounded-md whitespace-pre-wrap">
          {content || '(empty)'}
        </pre>
      </div>
      
      <Button onClick={() => console.log('Current content:', content)}>
        Log Content
      </Button>
    </div>
  );
} 