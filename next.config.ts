import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 明确指定 Turbopack 的 workspace root，避免多 lockfile 误判
  turbopack: {
    root: path.resolve(__dirname),
  },
  // 允许从外部域名加载图片
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
