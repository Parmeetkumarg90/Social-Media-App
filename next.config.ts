import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false, // disable floating nextjs indicator
  reactStrictMode: false, // disable StrictMode of react which cause rendering twice for bug hunting
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
