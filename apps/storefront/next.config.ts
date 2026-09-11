import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Zone assets are served through the shell, so they need a collision-free prefix.
  assetPrefix: "/storefront-static",
  async rewrites() {
    const shellUrl = process.env.WEB_SHELL_URL?.replace(/\/$/, "");
    return shellUrl ? [{ source: "/api/:path*", destination: `${shellUrl}/api/:path*` }] : [];
  },
};

export default nextConfig;
