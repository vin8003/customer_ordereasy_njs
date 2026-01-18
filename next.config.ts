import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ordereasy.win',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all for now during development/migration
      }
    ],
  },
};

export default nextConfig;
