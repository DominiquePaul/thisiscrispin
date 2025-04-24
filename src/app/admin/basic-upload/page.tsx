"use client";

import { useState } from 'react';

export default function BasicUploadTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Starting upload for file:', file.name);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload file directly
      const response = await fetch('/api/upload-test', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setResult(data);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Basic Upload Test</h1>
      
      <div className="mb-6">
        <p className="mb-2">Select an image file to upload directly to Contentful:</p>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          disabled={isUploading}
          className="block border p-2"
        />
      </div>
      
      {isUploading && <p className="text-blue-500">Uploading...</p>}
      
      {error && <p className="text-red-500">Error: {error}</p>}
      
      {result && (
        <div className="mt-4 p-4 border rounded">
          <h2 className="font-bold">Upload Result:</h2>
          {result.asset?.url ? (
            <>
              <p className="break-all mt-2">{result.asset.url}</p>
              <div className="mt-4">
                <img 
                  src={result.asset.url} 
                  alt="Uploaded" 
                  className="max-w-md border"
                />
              </div>
            </>
          ) : (
            <p>No URL returned</p>
          )}
        </div>
      )}
    </div>
  );
} 