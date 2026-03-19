/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "standalone",
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  // Serverless components that use Node.js-specific modules
  serverExternalPackages: ["jsonwebtoken", "bcryptjs", "crypto"],
};

module.exports = nextConfig;
