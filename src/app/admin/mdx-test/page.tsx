"use client";

import { useState } from 'react';
import MDXEditor from '@/components/MDXEditor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function MDXEditorTest() {
  const [content, setContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // Simple direct image upload handler
  const handleImageUpload = async (file: File) => {
    console.log('⭐ MDX Test Page - handleImageUpload called with file:', file.name);
    setUploadStatus('Uploading...');
    
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Log the request details
      console.log('⭐ Sending API request to /api/contentful/asset');
      
      // Upload the image
      const response = await fetch('/api/contentful/asset', {
        method: 'POST',
        body: formData
      });
      
      console.log('⭐ Received API response:', { 
        status: response.status, 
        ok: response.ok 
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('⭐ Response data:', data);
      
      if (!data.asset?.url) {
        throw new Error('No URL in response');
      }
      
      setUploadStatus('Upload successful!');
      setUploadedUrl(data.asset.url);
      
      return {
        url: data.asset.url,
        width: data.asset.width || 0,
        height: data.asset.height || 0
      };
    } catch (error) {
      console.error('⭐ Upload error:', error);
      setUploadStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { url: '', width: 0, height: 0 };
    }
  };
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">MDX Editor Test Page</h1>
      
      {uploadStatus && (
        <Alert className="mb-6">
          <AlertDescription>{uploadStatus}</AlertDescription>
        </Alert>
      )}
      
      {uploadedUrl && (
        <div className="mb-6 p-4 border rounded-md">
          <p className="font-medium mb-2">Last uploaded image:</p>
          <img 
            src={uploadedUrl} 
            alt="Uploaded" 
            className="max-w-md h-auto rounded-md mb-2"
          />
          <div className="break-all text-sm">{uploadedUrl}</div>
        </div>
      )}
      
      <div className="mb-6 border rounded-md">
        <MDXEditor 
          initialContent={content}
          onChange={setContent}
          onUploadImage={handleImageUpload}
        />
      </div>
      
      <div className="mb-6">
        <h2 className="text-lg font-medium mb-2">Current Content:</h2>
        <pre className="bg-gray-100 p-4 rounded-md overflow-auto whitespace-pre-wrap">
          {content || '(empty)'}
        </pre>
      </div>
      
      <div className="mb-6">
        <Button onClick={() => console.log('Current content:', content)}>
          Log Content
        </Button>
      </div>
    </div>
  );
} 