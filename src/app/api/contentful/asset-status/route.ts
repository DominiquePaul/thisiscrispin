import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEnvironment } from '@/lib/contentful-management';

// Check the status of a Contentful asset by ID
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const assetId = searchParams.get('id');
  
  if (!assetId) {
    return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
  }
  
  try {
    const spaceId = process.env.CONTENTFUL_PUBLIC_SPACE_ID;
    const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
    
    // Get the asset directly from the API
    const response = await fetch(
      `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Failed to fetch asset ${assetId}:`, errorData);
      return NextResponse.json(
        { error: `Failed to fetch asset: ${JSON.stringify(errorData)}` },
        { status: response.status }
      );
    }
    
    const asset = await response.json();
    
    // Check if asset has been published
    const isPublished = asset.sys.publishedVersion !== undefined;
    
    // Check if asset has a file URL
    const hasUrl = !!asset.fields?.file?.['en-US']?.url;
    
    // Determine processing status
    let status;
    if (isPublished && hasUrl) {
      status = 'published';
    } else if (hasUrl) {
      status = 'processed_unpublished';
    } else {
      status = 'processing';
    }
    
    // Try to publish the asset if it's processed but not published
    let publishAttemptResult = null;
    if (status === 'processed_unpublished') {
      try {
        console.log(`Attempting to publish asset ${assetId}...`);
        
        const publishResponse = await fetch(
          `https://api.contentful.com/spaces/${spaceId}/environments/${environmentId}/assets/${assetId}/published`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/vnd.contentful.management.v1+json',
              'Authorization': `Bearer ${process.env.CONTENTFUL_MANAGEMENT_TOKEN}`,
              'X-Contentful-Version': asset.sys.version.toString(),
            },
          }
        );
        
        if (publishResponse.ok) {
          const publishedAsset = await publishResponse.json();
          status = 'published';
          console.log(`Successfully published asset ${assetId}`);
          publishAttemptResult = 'success';
          
          // Return the published asset
          return NextResponse.json({
            success: true,
            asset: {
              id: publishedAsset.sys.id,
              url: `https:${publishedAsset.fields?.file?.['en-US']?.url || ''}`,
              width: publishedAsset.fields?.file?.['en-US']?.details?.image?.width || 0,
              height: publishedAsset.fields?.file?.['en-US']?.details?.image?.height || 0,
              status: 'published'
            },
            publishAttempt: publishAttemptResult
          });
        } else {
          const errorData = await publishResponse.json().catch(() => ({}));
          console.error(`Failed to publish asset ${assetId}:`, errorData);
          publishAttemptResult = {
            error: errorData,
            message: 'Failed to publish asset'
          };
        }
      } catch (error) {
        console.error(`Error publishing asset ${assetId}:`, error);
        publishAttemptResult = {
          error: error instanceof Error ? error.message : String(error),
          message: 'Error occurred during publish attempt'
        };
      }
    }
    
    // Create the response with current asset status
    const assetUrl = asset.fields?.file?.['en-US']?.url;
    
    return NextResponse.json({
      success: true,
      asset: {
        id: asset.sys.id,
        url: assetUrl ? `https:${assetUrl}` : '',
        width: asset.fields?.file?.['en-US']?.details?.image?.width || 0,
        height: asset.fields?.file?.['en-US']?.details?.image?.height || 0,
        status
      },
      isPublished,
      hasUrl,
      publishAttempt: publishAttemptResult,
      assetDetails: {
        version: asset.sys.version,
        createdAt: asset.sys.createdAt,
        updatedAt: asset.sys.updatedAt,
        publishedVersion: asset.sys.publishedVersion,
        fileName: asset.fields?.file?.['en-US']?.fileName,
        contentType: asset.fields?.file?.['en-US']?.contentType
      }
    });
    
  } catch (error) {
    console.error('Error checking asset status:', error);
    return NextResponse.json(
      { error: 'Failed to check asset status: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 