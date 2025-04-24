import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEnvironment } from '@/lib/contentful-management';
import sharp from 'sharp';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const LARGE_FILE_THRESHOLD = 1 * 1024 * 1024; // 1MB

// Upload an asset to Contentful
export async function POST(req: NextRequest) {
  try {
    // Check if request is multipart/form-data
    const requestContentType = req.headers.get('content-type') || '';
    if (!requestContentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Check file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    // Process image with sharp
    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    
    // Check file size and optimize if needed
    let processedBuffer: Buffer;
    let width: number;
    let height: number;
    const fileContentType = file.type; // Use original content type
    
    if (originalBuffer.length > LARGE_FILE_THRESHOLD) {
      // Optimize large images with sharp but keep original format
      const image = sharp(originalBuffer);
      const metadata = await image.metadata();
      
      // Determine if we need to resize based on dimensions
      let optimizedImage = image;
      const MAX_DIMENSION = 2000; // Maximum width or height
      
      if ((metadata.width && metadata.width > MAX_DIMENSION) || 
          (metadata.height && metadata.height > MAX_DIMENSION)) {
        optimizedImage = optimizedImage.resize({
          width: metadata.width && metadata.width > MAX_DIMENSION ? MAX_DIMENSION : undefined,
          height: metadata.height && metadata.height > MAX_DIMENSION ? MAX_DIMENSION : undefined,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Keep original format instead of forcing WebP
      processedBuffer = await optimizedImage.toBuffer();
      
      // Get final dimensions
      const finalMetadata = await sharp(processedBuffer).metadata();
      width = finalMetadata.width || 0;
      height = finalMetadata.height || 0;
    } else {
      // For smaller images, just optimize without changing format
      processedBuffer = originalBuffer;
      const metadata = await sharp(processedBuffer).metadata();
      width = metadata.width || 0;
      height = metadata.height || 0;
    }
    
    const { environment, space } = await getSpaceEnvironment();
    
    // 1. Create upload using the upload API
    const spaceId = process.env.CONTENTFUL_PUBLIC_SPACE_ID;
    const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
    
    // Generate a unique filename with original extension
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    console.log(`Starting upload for file ${fileName}, size: ${processedBuffer.length} bytes, type: ${fileContentType}`);
    
    try {
      // First create an upload using the proper method recommended by Contentful
      const uploadResponse = await fetch(`https://upload.contentful.com/spaces/${spaceId}/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/octet-stream',
        },
        body: processedBuffer,
      });
      
      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error("Upload creation failed:", errorData);
        throw new Error(`Failed to create upload: ${JSON.stringify(errorData)}`);
      }
      
      const uploadResult = await uploadResponse.json();
      const uploadId = uploadResult.sys.id;
      
      console.log(`Upload successful with ID: ${uploadId}`);
      
      // 2. Create the asset with the upload
      console.log('Creating asset with upload ID:', uploadId);
      
      const assetData = {
        fields: {
          title: {
            'en-US': file.name.split('.')[0] // Use original filename without extension
          },
          description: {
            'en-US': `Uploaded on ${new Date().toISOString()}`
          },
          file: {
            'en-US': {
              contentType: fileContentType, // Use original content type
              fileName,
              upload: `https://upload.contentful.com/spaces/${spaceId}/uploads/${uploadId}`
            }
          }
        }
      };
      
      console.log('Asset creation data:', JSON.stringify(assetData));
      
      // Create the asset using the content management API directly
      const createAssetResponse = await fetch(
        `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
            'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
          },
          body: JSON.stringify(assetData),
        }
      );
      
      if (!createAssetResponse.ok) {
        const errorData = await createAssetResponse.json().catch(() => ({}));
        console.error("Asset creation failed:", errorData);
        throw new Error(`Failed to create asset: ${JSON.stringify(errorData)}`);
      }
      
      const asset = await createAssetResponse.json();
      console.log('Asset created successfully with ID:', asset.sys.id);
      
      // 3. Process the asset
      console.log('Processing asset...');
      
      // Process the asset using direct API call
      const processResponse = await fetch(
        `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${asset.sys.id}/files/en-US/process`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/vnd.contentful.management.v1+json',
            'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
            'X-Contentful-Version': asset.sys.version.toString(),
          },
        }
      );
      
      if (!processResponse.ok) {
        const errorData = await processResponse.json().catch(() => ({}));
        console.error("Asset processing failed:", errorData);
        
        // Even if processing fails, return what we have
        // Create a simple SVG placeholder using base64 encoding
        const assetId = asset.sys.id.substring(0, 8);
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
          <rect width="800" height="450" fill="#f0f0f0"/>
          <text x="400" y="200" font-family="Arial" font-size="24" text-anchor="middle" fill="#888">Processing Image</text>
          <text x="400" y="240" font-family="Arial" font-size="18" text-anchor="middle" fill="#888">ID: ${assetId}</text>
        </svg>`;
        const base64Svg = Buffer.from(placeholderSvg).toString('base64');
        const placeholderUrl = `data:image/svg+xml;base64,${base64Svg}`;
        
        // Return early with processing status
        return NextResponse.json({
          success: true,
          asset: {
            id: asset.sys.id,
            url: placeholderUrl,
            width: 800,
            height: 450,
            status: 'processing'
          },
          message: 'Asset uploaded but processing failed. Please check Contentful directly.',
          error: JSON.stringify(errorData)
        });
      }
      
      // 4. Publish the asset
      console.log('Publishing asset...');
      
      // Wait longer for processing to complete
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Get the latest version of the asset
      const getAssetResponse = await fetch(
        `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${asset.sys.id}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
          },
        }
      );
      
      if (!getAssetResponse.ok) {
        throw new Error('Failed to get updated asset');
      }
      
      const updatedAsset = await getAssetResponse.json();
      console.log('Retrieved asset for publishing, version:', updatedAsset.sys.version);
      
      // Check for file URL before attempting to publish
      const assetUrl = updatedAsset.fields?.file?.['en-US']?.url;
      
      // If we don't have a URL yet, the asset isn't ready to be published
      if (!assetUrl) {
        console.log('Asset does not yet have a URL, returning processed but unpublished');
        
        // Return the base64 placeholder for now
        const assetId = asset.sys.id.substring(0, 8);
        const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
          <rect width="800" height="450" fill="#f0f0f0"/>
          <text x="400" y="200" font-family="Arial" font-size="24" text-anchor="middle" fill="#888">Processing Image</text>
          <text x="400" y="240" font-family="Arial" font-size="18" text-anchor="middle" fill="#888">ID: ${assetId}</text>
        </svg>`;
        const base64Svg = Buffer.from(placeholderSvg).toString('base64');
        const placeholderUrl = `data:image/svg+xml;base64,${base64Svg}`;
        
        return NextResponse.json({
          success: true,
          asset: {
            id: updatedAsset.sys.id,
            url: placeholderUrl,
            width: 800,
            height: 450,
            status: 'processed_unpublished'
          },
          message: 'Asset is still processing. Please check back in a few moments.'
        });
      }
      
      // We have a URL, even if we can't publish, we can return it
      const finalUrl = `https:${assetUrl}`;
      
      // Try to publish the asset
      try {
        const publishResponse = await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${asset.sys.id}/published`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/vnd.contentful.management.v1+json',
              'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
              'X-Contentful-Version': updatedAsset.sys.version.toString(),
            },
          }
        );
        
        if (!publishResponse.ok) {
          const errorData = await publishResponse.json().catch(() => ({}));
          // Log full error details
          console.error("Asset publishing failed:", JSON.stringify(errorData, null, 2));
          
          // Return the URL anyway since we have one
          return NextResponse.json({
            success: true,
            asset: {
              id: updatedAsset.sys.id,
              url: finalUrl,
              width,
              height,
              status: 'processed_unpublished'
            },
            message: 'Asset processed but not published. The image is available but not officially published.'
          });
        }
        
        const publishedAsset = await publishResponse.json();
        console.log('Asset published successfully');
        
        // Return the published asset URL
        const publishedUrl = publishedAsset.fields?.file?.['en-US']?.url;
        return NextResponse.json({
          success: true,
          asset: {
            id: publishedAsset.sys.id,
            url: publishedUrl ? `https:${publishedUrl}` : finalUrl, // Fallback to the unpublished URL if needed
            width,
            height,
            status: 'published'
          }
        });
      } catch (publishError) {
        console.error('Error during publish attempt:', publishError);
        
        // Return the URL we already have
        return NextResponse.json({
          success: true,
          asset: {
            id: updatedAsset.sys.id,
            url: finalUrl,
            width,
            height,
            status: 'processed_unpublished'
          },
          message: 'Asset processed but publishing failed. The image is still available.'
        });
      }
      
    } catch (error) {
      console.error('Error in asset creation process:', error);
      return NextResponse.json(
        { error: 'Failed to upload asset: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: 'Failed to upload asset: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 