import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@store/db"],
  experimental: {
    agentFeedback: true,
    serverActions: {
      bodySizeLimit: "5mb", // Default is 4mb, but we need more for product images.
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
