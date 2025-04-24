"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";

interface ContentDebuggerProps {
  content: string;
  title?: string;
}

export default function ContentDebugger({ content, title }: ContentDebuggerProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  const toggleVisibility = () => setIsVisible(!isVisible);
  
  // Extract image URLs from the content
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = content ? [...content.matchAll(imageRegex)] : [];
  const imageUrls = matches.map(match => match[1]);
  
  return (
    <div className="mt-4 border-t pt-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleVisibility}
        className="text-xs"
      >
        {isVisible ? 'Hide Debug Info' : 'Show Debug Info'}
      </Button>
      
      {isVisible && (
        <div className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto">
          <h4 className="font-medium mb-2">Debug Information</h4>
          
          {title && (
            <div className="mb-2">
              <div className="font-medium">Title:</div>
              <div className="font-mono bg-white p-1 rounded mt-1">{title}</div>
            </div>
          )}
          
          <div className="mb-2">
            <div className="font-medium">Content Length: {content?.length || 0} characters</div>
          </div>
          
          <div className="mb-2">
            <div className="font-medium">Found Images: {imageUrls.length}</div>
            {imageUrls.length > 0 && (
              <ul className="list-disc pl-5 mt-1">
                {imageUrls.map((url, index) => (
                  <li key={index} className="break-all">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div>
            <div className="font-medium">Raw Content:</div>
            <pre className="font-mono bg-white p-2 rounded mt-1 whitespace-pre-wrap overflow-x-auto max-h-40">
              {content || '(empty)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 