import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Easy",
  description: "Your daily needs, delivered.",
};

import NotificationWrapper from "@/app/components/NotificationWrapper";
import { CartProvider } from "@/context/CartContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pb-48 overflow-x-hidden`}>
        <CartProvider>
          <NotificationWrapper>
            {children}
          </NotificationWrapper>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
