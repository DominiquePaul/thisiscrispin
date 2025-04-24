"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UploadTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [assetId, setAssetId] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const handleTestUpload = async () => {
    setError(null);
    setUploadedImageUrl(null);
    setAssetId(null);
    setIsUploading(true);
    addLog('Starting test upload...');

    try {
      // First fetch the test image
      addLog('Fetching test image...');
      const imageResponse = await fetch('/api/test/black-pixel');
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch test image');
      }
      
      const imageBlob = await imageResponse.blob();
      addLog(`Got test image (${imageBlob.size} bytes)`);
      
      // Create a File object from the blob
      const file = new File([imageBlob], 'contentful-test-image.jpg', { type: 'image/jpeg' });
      
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      addLog('Uploading to Contentful...');
      
      // Upload to Contentful via API
      const response = await fetch('/api/contentful/asset', {
        method: 'POST',
        body: formData
      });
      
      // Get response data
      const data = await response.json();
      addLog(`Got response: ${JSON.stringify(data, null, 2)}`);
      
      // Handle errors
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      // Store the asset ID for later checking
      if (data.asset?.id) {
        setAssetId(data.asset.id);
        addLog(`Asset ID: ${data.asset.id}`);
      }
      
      // Validate response
      if (!data.asset?.url) {
        throw new Error('Invalid response from server: missing URL');
      }
      
      // Set the uploaded image URL
      setUploadedImageUrl(data.asset.url);
      addLog(`Upload successful: ${data.asset.url}`);
      addLog(`Status: ${data.asset.status}`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      addLog(`Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const checkAssetStatus = async () => {
    if (!assetId) {
      addLog('No asset ID available to check');
      return;
    }
    
    setIsChecking(true);
    addLog(`Checking status of asset ID: ${assetId}`);
    
    try {
      // Create an endpoint to check asset status
      const response = await fetch(`/api/contentful/asset-status?id=${assetId}`);
      const data = await response.json();
      
      addLog(`Asset status check result: ${JSON.stringify(data, null, 2)}`);
      
      if (data.asset?.url && data.asset.url !== uploadedImageUrl) {
        setUploadedImageUrl(data.asset.url);
        addLog(`Updated asset URL: ${data.asset.url}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`Error checking status: ${errorMessage}`);
    } finally {
      setIsChecking(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Contentful Upload Test</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center gap-4 mb-6">
        <Button 
          onClick={handleTestUpload}
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Test Upload'}
        </Button>
        
        {assetId && (
          <Button 
            variant="outline" 
            onClick={checkAssetStatus}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Status'}
          </Button>
        )}
        
        <Button variant="outline" onClick={clearLogs}>
          Clear Logs
        </Button>
      </div>
      
      {uploadedImageUrl && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Uploaded Image:</h2>
          <div className="border rounded-md overflow-hidden mb-2">
            <img 
              src={uploadedImageUrl} 
              alt="Uploaded test image" 
              className="max-w-full"
            />
          </div>
          <p className="text-sm text-gray-500 break-all">{uploadedImageUrl}</p>
          {assetId && (
            <p className="text-sm mt-2">Asset ID: {assetId}</p>
          )}
        </div>
      )}
      
      <div className="border rounded-md p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Upload Logs:</h2>
        <pre className="text-xs overflow-auto whitespace-pre-wrap max-h-80">
          {logs.length > 0 
            ? logs.join('\n') 
            : 'No logs yet. Run a test upload to see details here.'}
        </pre>
      </div>
    </div>
  );
} 