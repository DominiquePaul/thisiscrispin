import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEnvironment } from '@/lib/contentful-management';

// Get all content types from Contentful
export async function GET(req: NextRequest) {
  try {
    const { environment } = await getSpaceEnvironment();
    
    // Get all content types
    const contentTypes = await environment.getContentTypes();
    
    // Return simplified content type information
    return NextResponse.json({
      contentTypes: contentTypes.items.map(type => ({
        id: type.sys.id,
        name: type.name,
        displayField: type.displayField,
        fields: type.fields.map(field => ({
          id: field.id,
          name: field.name,
          type: field.type,
          required: field.required,
        }))
      }))
    });
    
  } catch (error) {
    console.error('Error fetching content types:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch content types' },
      { status: 500 }
    );
  }
} 