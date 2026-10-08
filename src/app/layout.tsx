import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import ModalProvider from "@/components/GlobalModals";
import Navigation from "@/components/Navigation";
import OpenPricingCta from "@/components/OpenPricingCta";
import SmoothScroll from "@/components/SmoothScroll";
import { ENV } from "@/lib/env";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(ENV.appUrl),
  title: {
    default: "DomainSniper AI — Expired Domain Radar, Valuation & Drop Catching",
    template: "%s · DomainSniper AI",
  },
  description:
    "Institutional-grade expired domain valuation, backlink juice audits and drop-catching radar. SniperScore 0–100, sub-second tripwire alerts across Telegram, WhatsApp and email before auction snipers strike.",
  keywords: [
    "expired domains",
    "drop catching",
    "domain valuation",
    "domain backlinks",
    "pending delete",
    "domain investing",
  ],
  openGraph: {
    title: "DomainSniper AI — Expired Domain Radar & Valuation",
    description:
      "SniperScore 0–100 on every ICANN pending-delete drop. Tripwire alerts before the auction bots strike.",
    url: "/",
    siteName: "DomainSniper AI",
    images: [{ url: "/api/og", width: 1200, height: 630, alt: "DomainSniper AI radar" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DomainSniper AI — Expired Domain Radar",
    description:
      "SniperScore 0–100 on every ICANN pending-delete drop, with sub-second tripwire alerts.",
    images: ["/api/og"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070b09",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${grotesk.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-abyss font-sans text-paper antialiased">
        <ModalProvider>
          <Navigation />
          <main className="relative min-h-[60vh]">{children}</main>
          <Footer />
          <OpenPricingCta />
          <SmoothScroll />
        </ModalProvider>
      </body>
    </html>
  );
}
