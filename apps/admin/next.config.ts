import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Public URLs are served under /admin by the shell, so internal routes must match.
  basePath: "/admin",
  async rewrites() {
    const shellUrl = process.env.WEB_SHELL_URL?.replace(/\/$/, "");
    return shellUrl ? [{ source: "/api/:path*", destination: `${shellUrl}/api/:path*` }] : [];
  },
};

export default nextConfig;
