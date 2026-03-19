import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
  // Serverless components that use Node.js-specific modules
  serverExternalPackages: ["jsonwebtoken", "bcryptjs", "crypto"],
};

export default nextConfig;
