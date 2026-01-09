import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* relax build checks for Docker image builds */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/favicon.ico",
        destination: "/icon.ico",
      },
    ];
  },
};

export default nextConfig;
