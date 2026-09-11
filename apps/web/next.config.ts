import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const storefrontUrl = process.env.STOREFRONT_ZONE_URL?.replace(/\/$/, "");
    const adminUrl = process.env.ADMIN_ZONE_URL?.replace(/\/$/, "");
    const routes = [];

    if (storefrontUrl) {
      routes.push(
        {
          source: "/storefront-static/_next/:path+",
          destination: `${storefrontUrl}/storefront-static/_next/:path+`,
        },
        { source: "/", destination: `${storefrontUrl}/` },
        { source: "/products", destination: `${storefrontUrl}/products` },
        { source: "/products/:path*", destination: `${storefrontUrl}/products/:path*` },
        { source: "/product/:path*", destination: `${storefrontUrl}/product/:path*` },
        { source: "/cart", destination: `${storefrontUrl}/cart` },
        { source: "/checkout", destination: `${storefrontUrl}/checkout` },
        { source: "/orders/:path*", destination: `${storefrontUrl}/orders/:path*` },
      );
    }

    if (adminUrl) {
      routes.push({ source: "/admin/:path*", destination: `${adminUrl}/admin/:path*` });
    }

    return { beforeFiles: routes };
  },
  async redirects() {
    if (!process.env.ADMIN_ZONE_URL) {
      return [];
    }

    return [{ source: "/inventory", destination: "/admin/inventory", permanent: false }];
  },
};

export default nextConfig;
