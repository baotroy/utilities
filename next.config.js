/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "standalone",
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  // Serverless components that use Node.js-specific modules
  serverExternalPackages: ["bcryptjs", "crypto"],
  // Disable legacy browser polyfills
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
  // Cache headers for static assets
  headers: async () => [
    {
      source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ],
};

module.exports = nextConfig;
