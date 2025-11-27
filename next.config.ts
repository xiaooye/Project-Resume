import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Vercel optimization: Ensure proper headers for SSE
  async headers() {
    return [
      {
        source: "/api/network-traffic",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-transform, no-store, must-revalidate",
          },
          {
            key: "X-Accel-Buffering",
            value: "no",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
