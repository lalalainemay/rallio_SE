import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Allow all HTTPS images (restrict in production)
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // serverActions: true, // Enable Server Actions if you use them
  },
};

export default nextConfig;