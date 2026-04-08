import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartSidebar } from "@/components/CartSidebar";
import { Toaster } from "sonner";
import { WelcomeModal } from "@/components/marketing/WelcomeModal";
import { auth } from "@/auth";
import { Suspense } from "react";
import Script from "next/script";
import { AffiliateTracker } from "@/components/AffiliateTracker";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

import { LoginModal } from "@/components/auth/LoginModal";
import { TawkToChat } from "@/components/TawkToChat";

export const metadata: Metadata = {
  title: "Mimozo - Custom 3D Figurines From Your Photos",
  description: "Upload your photo and transform it into a unique handcrafted 3D figurine. AI-powered personalization, premium quality.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en" suppressHydrationWarning className={`dark ${outfit.variable} ${inter.variable}`}>
      <head>
        {/* GoAffPro 分销联盟追踪脚本 */}
        <Script
          src={`https://api.goaffpro.com/loader.js?shop=${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}`}
          strategy="afterInteractive"
        />
      </head>
      <body className="font-sans antialiased min-h-screen flex flex-col">
        <Providers>
          {/* GoAffPro 分销参数捕获 */}
          <Suspense fallback={null}>
            <AffiliateTracker />
          </Suspense>
          <Header />
          <main className="flex-1 w-full overflow-x-hidden">
            {children}
          </main>
          <Footer />
          <CartSidebar />
          {!session && <WelcomeModal />}
          <LoginModal />
          <TawkToChat />
        </Providers>
        <Toaster position="bottom-left" theme="dark" richColors />
      </body>
    </html>
  );
}
