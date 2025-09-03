import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "wdtkwfgmsbtjkraxzazx.supabase.co",
      "img1.kakaocdn.net",
      "t1.kakaocdn.net",
      "k.kakaocdn.net",
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
