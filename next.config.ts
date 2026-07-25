import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle at .next/standalone so the Docker
  // runtime image does not need the full node_modules tree.
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["pg"],
};

export default nextConfig;
