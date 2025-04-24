import { NextRequest, NextResponse } from 'next/server';
import { getEntryForEditing, updateEntry, getSpaceEnvironment } from '@/lib/contentful-management';

// Get a Contentful entry for editing
export async function GET(req: NextRequest) {
  try {
    // Get entry ID from query params
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const entry = await getEntryForEditing(entryId);
    return NextResponse.json({ entry });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// Update a Contentful entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { entryId, fields } = body;

    if (!entryId || !fields) {
      return NextResponse.json({ error: 'Entry ID and fields are required' }, { status: 400 });
    }

    // Transform fields to Contentful format (with locale)
    const contentfulFields: Record<string, any> = {};
    
    Object.entries(fields).forEach(([key, value]) => {
      contentfulFields[key] = { 'en-US': value };
    });

    const updatedEntry = await updateEntry(entryId, contentfulFields);
    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Error updating entry:', error);
    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to update entry',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

// Create a new Contentful entry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fields, contentType = 'markdownrtc' } = body;

    if (!fields || !fields.title || !fields.slug) {
      return NextResponse.json({ error: 'Title and slug are required' }, { status: 400 });
    }

    // Check if slug is unique
    const { environment } = await getSpaceEnvironment();
    
    // Format the query to search by slug
    const query = {
      content_type: contentType,
      'fields.slug': fields.slug['en-US'],
    };
    
    // Search for entries with the same slug
    const existingEntries = await environment.getEntries(query);
    
    if (existingEntries.items.length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    // Create a new entry
    const entry = await environment.createEntry(contentType, {
      fields: {
        ...fields
      }
    });
    
    // Publish the entry
    const publishedEntry = await entry.publish();
    
    return NextResponse.json({ entry: publishedEntry });
  } catch (error) {
    console.error('Error creating entry:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to create entry',
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
} 