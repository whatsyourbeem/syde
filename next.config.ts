import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wdtkwfgmsbtjkraxzazx.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 't1.kakaocdn.net',
      },
      {
        protocol: 'https',
        hostname: 'k.kakaocdn.net',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  /* config options here */
};

export default nextConfig;
