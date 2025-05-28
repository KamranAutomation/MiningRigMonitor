import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**.png', // Allow any .png file from placehold.co
      },
       {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // For Google user profile pictures
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
