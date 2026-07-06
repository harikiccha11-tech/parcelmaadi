import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "sfile.chatglm.cn" },
      { protocol: "https", hostname: "unpkg.com" },
    ],
  },
};

export default nextConfig;
