import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Disable image optimization completely to avoid any issues
    unoptimized: true,
    // Allow all external images
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
  },
  // Disable experimental features that might cause issues
  experimental: {},
};

export default nextConfig;
