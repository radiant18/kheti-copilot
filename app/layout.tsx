import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari, Noto_Sans_Kannada } from "next/font/google";
import { AppGate } from "@/components/AppGate";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

/**
 * Three faces, because the interface now runs in four languages across three
 * scripts. Jakarta carries Latin and the numerals; the Noto pair carries
 * Devanagari and Kannada at matching weights so a Hindi screen does not look
 * like a different product from an English one.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
  display: "swap",
});

const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kannada",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kheti — Farm Copilot",
  description:
    "Daily irrigation, spray and selling decisions for Indian farmers, priced in rupees.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kheti" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ea" },
    { media: "(prefers-color-scheme: dark)", color: "#17120d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${devanagari.variable} ${kannada.variable}`}>
      <body>
        <ServiceWorker />
        <AppGate>
          <div className="mx-auto min-h-[100svh] w-full max-w-[30rem] px-5">{children}</div>
          <BottomNav />
        </AppGate>
      </body>
    </html>
  );
}
