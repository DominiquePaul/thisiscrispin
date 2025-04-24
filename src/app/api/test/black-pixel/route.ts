import { NextResponse } from 'next/server';
import sharp from 'sharp';

// Generate a standard test image for Contentful uploads
export async function GET() {
  try {
    // Create a larger standard test image (600x400 with a gradient)
    const width = 600;
    const height = 400;
    
    // Generate a more complex test image - a gradient background with a circle
    const buffer = await sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 50, g: 100, b: 150 }
      }
    })
    // Create a simple gradient - use different approach to avoid linter error
    .tint({ r: 100, g: 150, b: 200 }) // Apply a tint for a simple color effect
    // Add a white circle in the middle
    .composite([{
      input: Buffer.from(
        `<svg width="${width}" height="${height}">
          <circle cx="${width/2}" cy="${height/2}" r="100" fill="white" />
          <text x="${width/2}" y="${height/2}" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="black">Test Image</text>
        </svg>`
      ),
      gravity: 'center'
    }])
    .jpeg({
      quality: 90,
      chromaSubsampling: '4:4:4' // High quality
    }) 
    .toBuffer();
    
    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="contentful-test-image.jpg"',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating test image:', error);
    return NextResponse.json(
      { error: 'Failed to generate test image' },
      { status: 500 }
    );
  }
} 