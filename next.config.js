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
};

module.exports = nextConfig;
