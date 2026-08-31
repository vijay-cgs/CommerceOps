import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../components/providers/query-provider";
import { AuthProvider } from "../components/providers/auth-provider";
import { CartProvider } from "../components/storefront/cart-provider";
import { NavHeader } from "../components/nav-header";
import { getSessionUser } from "../lib/auth";

export const metadata: Metadata = {
  title: "CommerceCart",
  description: "Modern storefront and commerce operations app",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
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
