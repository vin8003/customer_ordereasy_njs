import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
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

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Order Easy",
  description: "Your daily needs, delivered.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#1556f0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} font-sans antialiased overflow-x-hidden`}>
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
