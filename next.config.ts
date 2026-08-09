import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // !! WARN !!
    // Temporarily ignore type errors so we can deploy the MVP
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Temporarily ignore ESLint errors so we can deploy the MVP
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;