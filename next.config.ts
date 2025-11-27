import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Enable SharedArrayBuffer for FFmpeg (CRITICAL for video editing)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  // 2. Optimization for heavy libraries
  serverExternalPackages: ["@ffmpeg/ffmpeg"],
};

export default nextConfig;