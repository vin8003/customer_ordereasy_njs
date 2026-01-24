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
  title: "ShopEasy",
  description: "Your daily needs, delivered.",
};

import NotificationWrapper from "@/app/components/NotificationWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased pb-24 overflow-x-hidden`}>
        <NotificationWrapper>
          {children}
        </NotificationWrapper>
        <BottomNav />
      </body>
    </html>
  );
}
