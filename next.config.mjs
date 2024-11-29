/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'images.ctfassets.net',
        },
      ],
      domains: ['assets.ctfassets.net'],
    },
  }

export default nextConfig;