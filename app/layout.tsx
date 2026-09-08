import type { Metadata, Viewport } from "next";
import { AppGate } from "@/components/AppGate";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kheti — Farm Copilot",
  description:
    "Daily irrigation, spray and selling decisions for Indian farmers, priced in rupees.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Kheti" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#12130f" },
  ],
  width: "device-width",
  initialScale: 1,
  // Locked so a mis-tap on a small phone cannot zoom the layout out of use.
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppGate>
          <div className="mx-auto max-w-lg px-4">{children}</div>
          <BottomNav />
        </AppGate>
      </body>
    </html>
  );
}
