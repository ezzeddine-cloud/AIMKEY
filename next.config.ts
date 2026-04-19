import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Évite des erreurs webpack du type "Cannot read properties of undefined (reading 'call')" avec motion + Next 15. */
  transpilePackages: ["motion"],
};

export default nextConfig;
