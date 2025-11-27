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
      {
        // Enable cross-origin isolation for WASM multi-threading
        // Note: This may break some third-party scripts. Test thoroughly.
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
