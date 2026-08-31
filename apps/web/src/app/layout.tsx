import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../components/providers/query-provider";
import { CartProvider } from "../components/storefront/cart-provider";

export const metadata: Metadata = {
  title: "CommerceCart",
  description: "Modern storefront and commerce operations app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <CartProvider>{children}</CartProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
