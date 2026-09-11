import type { Metadata } from "next";
import { QueryProvider } from "../../../web/src/components/providers/query-provider";
import { AuthProvider } from "../../../web/src/components/providers/auth-provider";
import { CartProvider } from "../../../web/src/components/storefront/cart-provider";
import { NavHeader } from "../../../web/src/components/nav-header";
import { safeSessionUser } from "../lib/session-user";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommerceOps Storefront",
  description: "CommerceOps storefront zone",
};

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const user = await safeSessionUser();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider user={user}>
            <CartProvider>
              <NavHeader />
              {children}
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
