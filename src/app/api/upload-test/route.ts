import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Check if request is multipart/form-data
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Log file details but don't do anything else
    console.log('Test upload received:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // Return success response with dummy data
    return NextResponse.json({
      success: true,
      message: 'File received (test only)',
      file: {
        name: file.name,
        type: file.type,
        size: file.size
      },
      asset: {
        url: `https://dummyimage.com/600x400/000/fff&text=${encodeURIComponent(file.name)}`,
        width: 600,
        height: 400
      }
    });
  } catch (error) {
    console.error('Error in test upload:', error);
    return NextResponse.json(
      { error: 'Upload test failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 