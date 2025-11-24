/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.ctfassets.net',
        },
        {
          protocol: 'https',
          hostname: 'assets.ctfassets.net',
        },
      ],
    },
    webpack: (config, { isServer }) => {
      // Fix for Contentful packages in server-side rendering
      if (isServer) {
        config.externals = config.externals || [];
        config.externals.push({
          'contentful': 'commonjs contentful',
          'contentful-management': 'commonjs contentful-management',
          '@contentful/rich-text-react-renderer': 'commonjs @contentful/rich-text-react-renderer',
          '@contentful/rich-text-types': 'commonjs @contentful/rich-text-types',
        });
      }
      return config;
    },
  }

export default nextConfig;