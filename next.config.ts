import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wdtkwfgmsbtjkraxzazx.supabase.co",
      },
      {
        protocol: "https",
        hostname: "img1.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "t1.kakaocdn.net",
      },
      {
        protocol: "https",
        hostname: "k.kakaocdn.net",
      },
    ],
    minimumCacheTTL: 604800, // 1 week
    unoptimized: true, //FIXME: Vercel 요금 절약을 위한 이미지 최적화 비활성화
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production", // production에서 console.log 제거
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // FIXME: 이미지 용량 때문에 임시로 늘림, 추후 이미지 압축 등으로 줄일 것
    },
    optimizePackageImports: [
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-avatar",
      "@radix-ui/react-popover",
      "@radix-ui/react-tabs",
      "@radix-ui/react-accordion",
      "@radix-ui/react-select",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-hover-card",
      "@radix-ui/react-separator",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-label",
      "@radix-ui/react-navigation-menu",
      "lucide-react",
      "@tiptap/react",
      "@tiptap/starter-kit",
      "@tiptap/extension-image",
      "@tiptap/extension-link",
      "@tiptap/extension-placeholder",
      "@tiptap/extension-text-align",
      "@tanstack/react-query",
      "date-fns",
      "embla-carousel-react",
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          // Radix UI components in separate chunk
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: "radix-ui",
            priority: 20,
            reuseExistingChunk: true,
          },
          // TipTap editor components
          tiptap: {
            test: /[\\/]node_modules[\\/]@tiptap[\\/]/,
            name: "tiptap",
            priority: 20,
            reuseExistingChunk: true,
          },
          // React Query
          reactQuery: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: "react-query",
            priority: 20,
            reuseExistingChunk: true,
          },
          // Supabase
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: "supabase",
            priority: 20,
            reuseExistingChunk: true,
          },
          // Other vendors
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: "common",
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Tree shaking improvements
    config.optimization.usedExports = true;
    config.optimization.sideEffects = false;

    return config;
  },
  /* config options here */
};

export default withBundleAnalyzer(nextConfig);
