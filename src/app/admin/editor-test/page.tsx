"use client";

import { useState } from 'react';
import MDXEditor from '@/components/MDXEditor';
import ContentDebugger from '@/components/ContentDebugger';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditorTestPage() {
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [message, setMessage] = useState('');
  
  // Simplified image upload handler that uses local URLs for testing
  const handleImageUpload = async (file: File) => {
    // Create a local URL for the image (works in the browser only)
    const localUrl = URL.createObjectURL(file);
    console.log('Created local URL for image:', localUrl);
    
    // In a real app, you'd upload to a server, but for testing we just use the local URL
    return { 
      url: localUrl,
      width: 400,
      height: 300 
    };
  };
  
  const handleSave = () => {
    console.log('Saving content:', content);
    setSavedContent(content);
    setMessage('Content saved!');
    setTimeout(() => setMessage(''), 3000);
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">MDX Editor Test Page</h1>
      
      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <MDXEditor 
          initialContent={content}
          onChange={setContent}
          onUploadImage={handleImageUpload}
        />
      </div>
      
      <div className="mb-6">
        <Button onClick={handleSave}>Save Content</Button>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">Current Editor State:</h2>
        <ContentDebugger content={content} />
      </div>
      
      <div className="mb-6 pt-6 border-t">
        <h2 className="text-xl font-bold mb-3">Last Saved Content:</h2>
        <ContentDebugger content={savedContent} />
      </div>
    </div>
  );
} 