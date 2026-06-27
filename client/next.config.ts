import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "@supabase/supabase-js",
      "lucide-react",
      "posthog-js",
    ],
  },
  images: {
    qualities: [60, 75],
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "assets.myntassets.com" },
      { protocol: "https", hostname: "i.pinimg.com" },
      { protocol: "https", hostname: "d2wbq7o4qxi60y.cloudfront.net" },
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "image.hm.com" },
      { protocol: "https", hostname: "imagescdn.allensolly.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "offduty.in" },
    ],
  },
  // TypeScript errors must be fixed — do not suppress in production builds
  typescript: {
    ignoreBuildErrors: false,
  },
};

// Only wrap with Sentry in production builds — it significantly slows dev compilation
const isDev = process.env.NODE_ENV === "development";

let exportedConfig: NextConfig = nextConfig;

if (!isDev) {
  const { withSentryConfig } = require("@sentry/nextjs");
  exportedConfig = withSentryConfig(nextConfig, {
    org: "stylesense-42",
    project: "javascript-nextjs",
    silent: true,

    // Source maps
    widenClientFileUpload: true,
    hideSourceMaps: true,

    // Tunnel to bypass ad blockers
    tunnelRoute: "/monitoring",

    // Performance
    automaticVercelMonitors: true,
    disableLogger: true,
  });
}

export default exportedConfig;
