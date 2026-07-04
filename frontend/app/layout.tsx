import type { Metadata, Viewport } from "next";
import { PwaProvider } from "@/providers/PwaProvider";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import "./globals.css";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "My PWA App",
  description: "A production-ready Progressive Web Application built with Next.js.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "My PWA App",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "My PWA App",
    description: "A production-ready Progressive Web Application.",
  },
};

// ─── Viewport ─────────────────────────────────────────────────────────────────

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#007aff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a84ff" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover", // Required for safe-area-inset on notched devices.
};

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* iOS splash / touch icons */}
        <link rel="apple-touch-icon" href="/icons/icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png" />

        {/* iOS standalone meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My PWA App" />

        {/* Prevent tap highlight on iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body>
        {/*
         * PwaProvider:
         *  - Runs the usePwaInstall hook globally.
         *  - Renders the install prompt sheet over all page content.
         *  - Exposes usePwa() to any child component.
         */}
        <PwaProvider
          appName="My PWA App"
          appDescription="Install for a faster, offline-ready experience."
          appIconSrc="/icons/icon-192x192.png"
        >
          {children}
        </PwaProvider>

        {/*
         * ServiceWorkerRegistrar:
         *  - Client component, renders null to the DOM.
         *  - Registers /sw.js after the page load event.
         */}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}