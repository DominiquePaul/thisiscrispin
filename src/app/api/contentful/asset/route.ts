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
    
    // Get environment using SDK
    const { environment } = await getSpaceEnvironment();
    
    // Generate a unique filename with original extension
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
    
    console.log(`Creating asset for file ${fileName}, size: ${processedBuffer.length} bytes, type: ${fileContentType}`);

    try {
      // Use createAssetFromFiles method directly as shown in the GitHub example
      // This should be more reliable than the separate upload-then-create approach
      const asset = await environment.createAssetFromFiles({
        fields: {
          title: {
            'en-US': file.name.split('.')[0] // Use original filename without extension
          },
          description: {
            'en-US': `Uploaded on ${new Date().toISOString()}`
          },
          file: {
            'en-US': {
              contentType: fileContentType, 
              fileName,
              file: processedBuffer as unknown as ArrayBuffer // Convert to expected type
            }
          }
        }
      });

      console.log('Asset created successfully with ID:', asset.sys.id);
      
      // Process and publish the asset
      try {
        console.log('Processing asset...');
        const processedAsset = await asset.processForAllLocales();
        console.log('Asset processed successfully');
        
        try {
          console.log('Publishing asset...');
          const publishedAsset = await processedAsset.publish();
          console.log('Asset published successfully');
          
          return NextResponse.json({
            success: true,
            asset: {
              id: publishedAsset.sys.id,
              url: `https:${publishedAsset.fields.file?.['en-US']?.url || ''}`,
              width,
              height,
              status: 'published'
            }
          });
        } catch (publishError) {
          console.error('Error publishing asset:', publishError);
          
          // If publishing fails, return the processed asset URL
          const assetUrl = processedAsset.fields.file?.['en-US']?.url;
          return NextResponse.json({
            success: true,
            asset: {
              id: processedAsset.sys.id,
              url: assetUrl ? `https:${assetUrl}` : '',
              width,
              height,
              status: 'processed_unpublished'
            },
            message: 'Asset processed but publishing failed. The image is available but not officially published.'
          });
        }
      } catch (processError) {
        console.error('Error processing asset:', processError);
        
        // Create a placeholder for assets that fail processing
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
            id: asset.sys.id,
            url: placeholderUrl,
            width: 800,
            height: 450,
            status: 'processing_failed'
          },
          message: 'Asset upload succeeded but processing failed. Please check Contentful directly.',
          error: processError instanceof Error ? processError.message : String(processError)
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