import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ordereasy.win',
      },
      {
        protocol: 'https',
        hostname: '**', // Allow all for now during development/migration
      },
    ],
  },
  ...(process.env.NODE_ENV === 'production'
    ? {
        turbopack: {
          resolveAlias: {
            '@/services/mockRetailers': './src/services/emptyMockRetailers.ts',
          },
        },
      }
    : {}),
};

export default nextConfig;
