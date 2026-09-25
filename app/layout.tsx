import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Sans_Telugu,
  Noto_Sans_Tamil,
  Noto_Sans_Bengali,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Oriya,
  Noto_Sans_Malayalam,
  Noto_Sans_Arabic,
} from "next/font/google";
import { AppGate } from "@/components/AppGate";
import { AppHeader } from "@/components/AppHeader";
import { AskFab } from "@/components/AskFab";
import { BottomNav } from "@/components/BottomNav";
import { ServiceWorker } from "@/components/ServiceWorker";
import "./globals.css";

/**
 * Eleven faces, because the interface now runs in fourteen languages across
 * eleven scripts. Jakarta carries Latin and the numerals; the Noto set carries
 * the ten others at matching weights, so a Telugu screen does not look like a
 * different product from an English one. Devanagari serves Hindi, Marathi and
 * Maithili; the Bengali face serves Assamese too.
 *
 * Urdu gets Noto Sans Arabic rather than Nastaliq. Nastaliq is what Urdu
 * print looks like, but its diagonal stacking needs far more line height than
 * a tight phone UI has, and clipped descenders read worse than a plainer hand.
 *
 * Only Jakarta is preloaded. `subsets` injects a preload tag by default, so
 * leaving it on would block first paint behind ten scripts the farmer cannot
 * read. With preload off the browser fetches a face only when a glyph in its
 * range is drawn: the language picker costs one weight per script to render the
 * fourteen names, and the chosen language then pulls the rest of its weights. Every
 * other script stays at that one file.
 *
 * The options are spelled out per font rather than shared from one object
 * because next/font reads them at build time: a spread fails to compile.
 */
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const devanagari = Noto_Sans_Devanagari({ subsets: ["devanagari"], weight: ["400", "500", "600", "700"], variable: "--font-devanagari", display: "swap", preload: false });
const kannada = Noto_Sans_Kannada({ subsets: ["kannada"], weight: ["400", "500", "600", "700"], variable: "--font-kannada", display: "swap", preload: false });
const telugu = Noto_Sans_Telugu({ subsets: ["telugu"], weight: ["400", "500", "600", "700"], variable: "--font-telugu", display: "swap", preload: false });
const tamil = Noto_Sans_Tamil({ subsets: ["tamil"], weight: ["400", "500", "600", "700"], variable: "--font-tamil", display: "swap", preload: false });
const bengali = Noto_Sans_Bengali({ subsets: ["bengali"], weight: ["400", "500", "600", "700"], variable: "--font-bengali", display: "swap", preload: false });
const gujarati = Noto_Sans_Gujarati({ subsets: ["gujarati"], weight: ["400", "500", "600", "700"], variable: "--font-gujarati", display: "swap", preload: false });
const gurmukhi = Noto_Sans_Gurmukhi({ subsets: ["gurmukhi"], weight: ["400", "500", "600", "700"], variable: "--font-gurmukhi", display: "swap", preload: false });
const oriya = Noto_Sans_Oriya({ subsets: ["oriya"], weight: ["400", "500", "600", "700"], variable: "--font-oriya", display: "swap", preload: false });

const malayalam = Noto_Sans_Malayalam({ subsets: ["malayalam"], weight: ["400", "500", "600", "700"], variable: "--font-malayalam", display: "swap", preload: false });
const arabic = Noto_Sans_Arabic({ subsets: ["arabic"], weight: ["400", "500", "600", "700"], variable: "--font-arabic", display: "swap", preload: false });

const fontVars = [sans, devanagari, kannada, telugu, tamil, bengali, gujarati, gurmukhi, oriya, malayalam, arabic]
  .map((f) => f.variable)
  .join(" ");

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
    <html lang="en" className={fontVars}>
      <body>
        {/*
          Runs before anything paints. Without it the page renders light for a
          frame and then flips, which on a dark phone looks like a fault. Kept
          inline and dependency-free for that reason — a React effect is already
          too late.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("kheti.theme.v1");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})()`,
          }}
        />
        <ServiceWorker />
        <AppGate>
          <AppHeader />
          <div className="mx-auto w-full max-w-[30rem] px-5">{children}</div>
          <AskFab />
          <BottomNav />
        </AppGate>
      </body>
    </html>
  );
}
