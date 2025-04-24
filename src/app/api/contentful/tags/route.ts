import { NextRequest, NextResponse } from 'next/server';
import { getSpaceEnvironment } from '@/lib/contentful-management';

// Get all tags from Contentful
export async function GET(req: NextRequest) {
  try {
    const { environment } = await getSpaceEnvironment();
    const tags = await environment.getTags();
    
    return NextResponse.json({
      tags: tags.items.map(tag => ({
        id: tag.sys.id,
        name: tag.name,
        sys: tag.sys
      }))
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

// Create a new tag in Contentful
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 });
    }

    const { environment } = await getSpaceEnvironment();
    
    // Generate a safe ID from the name (lowercase, no spaces, alphanumeric)
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Create a new tag with the ID and name
    const newTag = await environment.createTag(id, name);
    
    return NextResponse.json({
      tag: {
        id: newTag.sys.id,
        name: newTag.name,
        sys: newTag.sys
      }
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    );
  }
}

// Update tags for an entry
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { entryId, tagIds } = body;

    if (!entryId || !tagIds) {
      return NextResponse.json({ error: 'Entry ID and tag IDs are required' }, { status: 400 });
    }

    const { environment } = await getSpaceEnvironment();
    
    // Get the entry
    const entry = await environment.getEntry(entryId);
    
    // Update the entry's metadata with the tags
    entry.metadata = {
      tags: tagIds.map((id: string) => ({
        sys: {
          type: 'Link',
          linkType: 'Tag',
          id
        }
      }))
    };
    
    // Update the entry
    const updatedEntry = await entry.update();
    
    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error('Error updating entry tags:', error);
    return NextResponse.json(
      { error: 'Failed to update entry tags' },
      { status: 500 }
    );
  }
} 