import React from 'react';

interface VideoEmbedProps {
  url: string;
  title?: string;
}

const VideoEmbed: React.FC<VideoEmbedProps> = ({ url, title }) => {
  // Check if it's a direct video file (Contentful or other)
  const isDirectVideo = /\.(mp4|m4v|webm|ogg|mov)(\?.*)?$/i.test(url);
  
  // Handle Contentful video assets
  const isContentfulVideo = url.includes('ctfassets.net') || url.includes('contentful.com');
  
  // Handle YouTube links
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  
  // Handle Vimeo links
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);


  if (isDirectVideo || isContentfulVideo) {
    // Ensure HTTPS for Contentful assets
    let videoSrc = url;
    if (url.startsWith('//')) {
      videoSrc = `https:${url}`;
    }
    
    return (
      <figure className="my-6 w-full">
        <video 
          controls 
          className="w-full rounded-lg shadow-lg"
          style={{ maxHeight: '70vh' }}
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={videoSrc} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        
      </figure>
    );
  }

  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    return (
      <figure className="my-6 w-full">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title || 'YouTube video'}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        {title && (
          <figcaption className="text-sm text-gray-600 mt-2 text-center italic">{title}</figcaption>
        )}
      </figure>
    );
  }

  if (vimeoMatch) {
    const videoId = vimeoMatch[1];
    return (
      <figure className="my-6 w-full">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
            src={`https://player.vimeo.com/video/${videoId}`}
            title={title || 'Vimeo video'}
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        {title && (
          <figcaption className="text-sm text-gray-600 mt-2 text-center italic">{title}</figcaption>
        )}
      </figure>
    );
  }

  // Fallback: render as a regular link if not a recognized video format
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-blue-600 hover:text-blue-800 underline"
    >
      {title || url}
    </a>
  );
};

export default VideoEmbed; 