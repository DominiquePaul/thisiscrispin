"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Document } from '@contentful/rich-text-types';
import dynamic from 'next/dynamic';

// Dynamically import the Contentful Rich Text Editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import('@contentful/field-editor-rich-text').then((mod) => mod.RichTextEditor),
  { ssr: false }
);

interface ContentfulRichTextEditorProps {
  initialValue: Document;
  onChange: (value: Document) => void;
  onUploadImage?: (file: File) => Promise<{ 
    url: string; 
    width: number; 
    height: number;
    id?: string; // Contentful asset ID
  }>;
}

export default function ContentfulRichTextEditor({
  initialValue,
  onChange,
  onUploadImage
}: ContentfulRichTextEditorProps) {
  const [isClient, setIsClient] = useState(false);
  const [sdk, setSdk] = useState<any>(null);
  const valueRef = useRef<Document>(initialValue);
  const changeCallbacksRef = useRef<Set<(value: Document) => void>>(new Set());

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update ref when initialValue changes
  useEffect(() => {
    valueRef.current = initialValue;
    // Notify all subscribed callbacks
    changeCallbacksRef.current.forEach(callback => callback(initialValue));
  }, [initialValue]);

  // Create a mock SDK for the Rich Text Editor
  useEffect(() => {
    if (!isClient) return;

    // Create a proxy for entry.fields to always return the current value
    const entryFieldsProxy = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'content') {
          return {
            'en-US': valueRef.current,
            getValue: () => valueRef.current,
          };
        }
        return undefined;
      }
    });

    const mockSdk = {
      field: {
        id: 'content',
        locale: 'en-US',
        type: 'RichText',
        required: false,
        getValue: () => valueRef.current,
        setValue: (newValue: Document) => {
          valueRef.current = newValue;
          onChange(newValue);
          return Promise.resolve(newValue);
        },
        onValueChanged: (callback: (value: Document) => void) => {
          changeCallbacksRef.current.add(callback);
          // Return unsubscribe function
          return () => {
            changeCallbacksRef.current.delete(callback);
          };
        },
        removeValue: () => Promise.resolve(),
        getIsDisabled: () => false,
        onIsDisabledChanged: () => () => {},
      },
      entry: {
        fields: entryFieldsProxy,
        getSys: () => ({
          id: 'mock-entry-id',
          type: 'Entry',
          version: 1,
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
            },
          },
          environment: {
            sys: {
              type: 'Link',
              linkType: 'Environment',
              id: 'master',
            },
          },
          contentType: {
            sys: {
              type: 'Link',
              linkType: 'ContentType',
              id: 'markdownrtc',
            },
          },
        }),
        onSysChanged: () => () => {},
      },
      space: {
        getEntries: () => Promise.resolve({ items: [] }),
        getAssets: () => Promise.resolve({ items: [] }),
        createAsset: async (data: any) => {
          // This method is called when an image is uploaded
          if (!onUploadImage) {
            throw new Error('Image upload not configured');
          }
          
          // Extract the file from the upload data
          const file = data.fields?.file?.['en-US']?.upload;
          if (!file) {
            throw new Error('No file provided');
          }
          
          try {
            // Upload the image using the provided callback
            const result = await onUploadImage(file);
            
            // Use the actual Contentful asset ID from the upload result
            const assetId = result.id || `asset-${Date.now()}`;
            
            // Return a mock asset object that matches Contentful's structure
            return {
              sys: {
                id: assetId,
                type: 'Asset',
                version: 1,
                space: {
                  sys: {
                    type: 'Link',
                    linkType: 'Space',
                    id: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
                  },
                },
                environment: {
                  sys: {
                    type: 'Link',
                    linkType: 'Environment',
                    id: 'master',
                  },
                },
              },
              fields: {
                title: {
                  'en-US': data.fields?.title?.['en-US'] || file.name,
                },
                description: {
                  'en-US': data.fields?.description?.['en-US'] || '',
                },
                file: {
                  'en-US': {
                    url: result.url,
                    details: {
                      size: file.size || 0,
                      image: {
                        width: result.width,
                        height: result.height,
                      },
                    },
                    fileName: file.name,
                    contentType: file.type,
                  },
                },
              },
              processForLocale: async () => {
                // Mock process method
                return Promise.resolve();
              },
              publish: async () => {
                // Return the same object when "published"
                return {
                  sys: {
                    id: assetId,
                    type: 'Asset',
                    version: 2,
                    space: {
                      sys: {
                        type: 'Link',
                        linkType: 'Space',
                        id: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
                      },
                    },
                    environment: {
                      sys: {
                        type: 'Link',
                        linkType: 'Environment',
                        id: 'master',
                      },
                    },
                  },
                  fields: {
                    title: {
                      'en-US': data.fields?.title?.['en-US'] || file.name,
                    },
                    description: {
                      'en-US': data.fields?.description?.['en-US'] || '',
                    },
                    file: {
                      'en-US': {
                        url: result.url,
                        details: {
                          size: file.size || 0,
                          image: {
                            width: result.width,
                            height: result.height,
                          },
                        },
                        fileName: file.name,
                        contentType: file.type,
                      },
                    },
                  },
                };
              },
            };
          } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
          }
        },
        sys: {
          id: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
        },
      },
      navigator: {
        openEntry: () => {},
        openAsset: () => {},
      },
      access: {
        can: () => true,
      },
      ids: {
        space: process.env.NEXT_PUBLIC_CONTENTFUL_SPACE_ID || '',
        environment: 'master',
        entry: 'mock-entry-id',
        field: 'content',
      },
      parameters: {
        instance: {},
        installation: {},
      },
      locales: {
        default: 'en-US',
        available: ['en-US'],
        names: { 'en-US': 'English (United States)' },
        fallbacks: {},
      },
      contentType: {
        sys: {
          id: 'markdownrtc',
        },
        fields: [
          {
            id: 'content',
            name: 'Content',
            type: 'RichText',
            localized: false,
            required: false,
          },
        ],
      },
    };

    setSdk(mockSdk);
  }, [isClient, onChange, onUploadImage]);

  if (!isClient || !sdk) {
    return <div className="animate-pulse bg-gray-100 rounded-md h-[500px] w-full"></div>;
  }

  return (
    <div className="contentful-rich-text-editor w-full border border-gray-300 rounded-md p-4">
      <RichTextEditor
        sdk={sdk}
        isInitiallyDisabled={false}
      />
    </div>
  );
}
