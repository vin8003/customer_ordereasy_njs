import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";
import { Toaster } from "react-hot-toast";

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
            <Toaster
              position="top-center"
              containerStyle={{
                top: '50%',
                transform: 'translateY(-50%)'
              }}
            />
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
