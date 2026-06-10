import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "esellersvipstore.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "logoeps.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lzd-img-global.slatic.net",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ae01.alicdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.aliyun.com",
        port: "",
        pathname: "/**",
      },
      // Add more specific domains for better image loading
      {
        protocol: "https",
        hostname: "images-na.ssl-images-amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "amazon.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lazada.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "alibaba.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "alicdn.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "slatic.net",
        port: "",
        pathname: "/**",
      },
      // Generic patterns for any external images - these should catch most URLs
      {
        protocol: "http",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: true, // Disable optimization for external images
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  /* config options here */
};

export default nextConfig;
