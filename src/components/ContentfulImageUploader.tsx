"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContentfulImageUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setUploadedImageUrl(null);
    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to Contentful via API
      const response = await fetch('/api/contentful/asset', {
        method: 'POST',
        body: formData
      });
      
      // Get response data
      const data = await response.json();
      
      // Handle errors
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      // Validate response
      if (!data.asset?.url) {
        throw new Error('Invalid response from server');
      }
      
      // Set the uploaded image URL
      setUploadedImageUrl(data.asset.url);
      console.log('Upload successful:', data.asset);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-xl font-bold mb-4">Contentful Image Upload Test</h2>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {uploadedImageUrl && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium">Uploaded Image:</p>
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
            <img 
              src={uploadedImageUrl} 
              alt="Uploaded image" 
              className="object-cover w-full h-full"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500 break-all">{uploadedImageUrl}</p>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Select Image'}
        </Button>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        
        {uploadedImageUrl && (
          <Button 
            variant="outline" 
            onClick={() => {
              navigator.clipboard.writeText(uploadedImageUrl);
              alert('URL copied to clipboard!');
            }}
          >
            Copy URL
          </Button>
        )}
      </div>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Debug Information:</h3>
        <ul className="text-xs text-gray-600 list-disc pl-5">
          <li>Check your browser console for detailed error messages</li>
          <li>Verify your Contentful space ID and management token in .env.local</li>
          <li>Ensure your Contentful token has permission to create assets</li>
          <li>Try uploading a small image (&lt; 1MB) to rule out size issues</li>
        </ul>
      </div>
    </div>
  );
} 