import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";
import { Toaster } from "@/components/ui/sonner";
import NotificationWrapper from "@/app/components/NotificationWrapper";
import NativeBackButton from "@/app/components/NativeBackButton";
import { CartProvider } from "@/context/CartContext";
import { NotificationProvider } from "@/context/NotificationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Easy",
  description: "Your daily needs, delivered.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} font-sans antialiased overflow-x-hidden`}>
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_oklch(0.585_0.233_264.376_/_0.06),_transparent_60%)]" />
        <CartProvider>
          <NotificationProvider>
            <Toaster />
            <NotificationWrapper>
              <NativeBackButton />
              {children}
            </NotificationWrapper>
          </NotificationProvider>
          <BottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
