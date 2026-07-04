import type { MetadataRoute } from "next";

/**
 * Next.js 14+ App Router manifest route.
 * Served at /manifest.webmanifest automatically.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "My PWA App",
    short_name: "MyApp",
    description: "A production-ready Progressive Web Application built with Next.js.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#007aff",
    orientation: "portrait-primary",
    scope: "/",
    lang: "en",
    categories: ["productivity", "utilities"],
    icons: [
      // Android / Chrome
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      // Desktop / splash
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Home",
        short_name: "Home",
        description: "Go to the home page",
        url: "/",
        icons: [{ src: "/icons/icon-96x96.png", sizes: "96x96" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/mobile-home.png",
        sizes: "390x844",
        form_factor: "narrow",
        label: "Home screen on mobile",
      },
      {
        src: "/screenshots/desktop-home.png",
        sizes: "1280x800",
        form_factor: "wide",
        label: "Home screen on desktop",
      },
    ],
  };
}