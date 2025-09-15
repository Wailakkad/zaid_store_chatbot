import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.pinimg.com"], // allow loading images from Pinterest
  },
};

export default nextConfig;
