import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Easy",
  description: "Your daily needs, delivered.",
};

import NotificationWrapper from "@/app/components/NotificationWrapper";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased pb-48 overflow-x-hidden`}>
        <CartProvider>
          <NotificationProvider>
            <NotificationWrapper>
              {children}
            </NotificationWrapper>
          </NotificationProvider>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
