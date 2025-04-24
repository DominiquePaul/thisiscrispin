# Setting Up Contentful Image Uploads

This guide helps you troubleshoot and set up image uploads to Contentful in your Next.js application.

## Prerequisites

1. A Contentful account
2. A Contentful space
3. A Content Management API token with permissions to create and publish assets

## Setup Steps

### 1. Set Environment Variables

Create or update your `.env.local` file with the following variables:

```
CONTENTFUL_PUBLIC_SPACE_ID=your_space_id
CONTENTFUL_MANAGEMENT_TOKEN=your_management_token
CONTENTFUL_ENVIRONMENT=master
```

- **Space ID**: Found in your Contentful space settings
- **Management Token**: Generate this in Contentful → Settings → API Keys → Content management tokens
- **Environment**: Usually "master" unless you're using a different environment

### 2. Test Upload Functionality

Visit `/admin/image-test` in your application to use the test uploader. This will help you verify if your Contentful connection is working properly.

### 3. Troubleshooting

If uploads are not working:

1. **Check Browser Console**: Look for detailed error messages
2. **Verify API Credentials**: Make sure your space ID and token are correct
3. **Check Permissions**: Ensure your token has permission to create and publish assets
4. **File Size**: Try uploading a smaller image (< 1MB) to rule out size issues
5. **CORS Issues**: Ensure your Contentful space allows uploads from your domain
6. **Server Logs**: Check server logs for any backend errors

### 4. How Image Uploads Work

1. User selects an image through the MDXEditor
2. The `onUploadImage` function in `ContentfulEditor.tsx` handles the upload
3. It makes a request to `/api/contentful/asset` API route
4. The API route optimizes the image and uploads it to Contentful
5. Upon success, the URL is returned and inserted into the editor

### 5. Understanding "Manual Insertion"

"Manual insertion" refers to the fallback method of adding images by directly writing markdown syntax:

```markdown
![alt text](image-url)
```

If the automatic upload through the editor's UI fails, the editor falls back to inserting the image this way.

### 6. Debugging Tips

- Use `ContentfulImageUploader` component to test uploads directly
- Check the Network tab in browser dev tools to see API responses
- Look for any errors in the terminal where your Next.js server is running
- Verify your image is not too large (the limit is set to 5MB in the API route)

## Need Help?

If you continue experiencing issues, try:

1. Updating the contentful-management SDK
2. Checking if your Contentful plan allows asset uploads
3. Testing with a simple test image
4. Verifying that the necessary permissions are set up in Contentful 