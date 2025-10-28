import { createClient } from 'contentful-management';

// Initialize the contentful management client
const getManagementClient = () => {
  const managementToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN;
  
  if (!managementToken) {
    throw new Error('Contentful Management Token is required');
  }
  
  return createClient({
    accessToken: managementToken,
  });
};

// Get a specific space and environment
export const getSpaceEnvironment = async () => {
  const client = getManagementClient();
  const spaceId = process.env.CONTENTFUL_PUBLIC_SPACE_ID;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT || 'master';
  
  if (!spaceId) {
    throw new Error('Contentful Space ID is required');
  }
  
  const space = await client.getSpace(spaceId);
  const environment = await space.getEnvironment(environmentId);
  
  return { space, environment };
};

// Get an entry by ID for editing
export const getEntryForEditing = async (entryId: string) => {
  const { environment } = await getSpaceEnvironment();
  return environment.getEntry(entryId);
};

// Update an entry
export const updateEntry = async (entryId: string, fields: any) => {
  try {
    const { environment } = await getSpaceEnvironment();
    const entry = await environment.getEntry(entryId);
    
    console.log('Original entry fields:', JSON.stringify(entry.fields));
    console.log('New fields to update:', JSON.stringify(fields));
    
    // Make sure we don't have any invalid data in the fields
    const sanitizedFields: any = {};
    
    // Process and sanitize fields
    Object.entries(fields).forEach(([key, value]) => {
      // If the value is null or undefined, use an empty string instead
      if (value === null || value === undefined) {
        sanitizedFields[key] = { 'en-US': '' };
      } else {
        // Special handling for rich text content field
        if (key === 'content' && typeof value === 'object' && value !== null) {
          const enUsValue = (value as Record<string, any>)['en-US'];
          // Rich text content: already in proper Contentful document shape
          if (enUsValue && typeof enUsValue === 'object') {
            console.log('Rich text content detected, passing through as-is');
          }
        }
        sanitizedFields[key] = value;
      }
    });
    
    console.log('Sanitized fields:', JSON.stringify(sanitizedFields));
    
    // Update the entry fields, preserving any existing fields not included in the update
    entry.fields = {
      ...entry.fields,
      ...sanitizedFields
    };
    
    // Update the entry
    const updatedEntry = await entry.update();
    console.log('Entry updated successfully');
    
    // Publish the entry
    try {
      const publishedEntry = await updatedEntry.publish();
      console.log('Entry published successfully');
      return publishedEntry;
    } catch (publishError) {
      console.error('Error publishing entry:', publishError);
      // Return the updated entry even if publishing fails
      console.log('Returning updated but unpublished entry');
      return updatedEntry;
    }
  } catch (error: any) {
    console.error('Error in updateEntry:', error);
    
    // Handle specific Contentful API errors
    if (error.name === 'ValidationFailed') {
      console.error('Validation failed:', error.details);
    }
    
    throw error; // Re-throw for proper error handling upstream
  }
};

// Upload an asset directly to Contentful
export const uploadAsset = async (file: File, fileName: string, contentType: string) => {
  const { environment } = await getSpaceEnvironment();
  
  // Create a new asset
  const asset = await environment.createAsset({
    fields: {
      title: {
        'en-US': fileName
      },
      description: {
        'en-US': `Uploaded asset: ${fileName}`
      },
      file: {
        'en-US': {
          contentType,
          fileName,
          upload: `https://upload.contentful.com/spaces/${process.env.CONTENTFUL_PUBLIC_SPACE_ID}/environments/${process.env.CONTENTFUL_ENVIRONMENT || 'master'}/uploads/${file.name}`
        }
      }
    }
  });
  
  // Process the asset
  const processedAsset = await asset.processForAllLocales();
  
  // Publish the asset
  const publishedAsset = await processedAsset.publish();
  
  return publishedAsset;
};

// Get all available tags from Contentful
export const getAllTags = async () => {
  const { environment } = await getSpaceEnvironment();
  const tags = await environment.getTags();
  return tags.items;
}; 