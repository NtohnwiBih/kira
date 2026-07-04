"use client";

/**
 * @module ServiceWorkerRegistrar
 * @description Client component that registers the service worker once on mount.
 * Drop this into the root layout — it renders nothing to the DOM.
 */

import { useEffect } from "react";

interface ServiceWorkerRegistrarProps {
  /** Path to the service worker script. Defaults to "/sw.js". */
  swPath?: string;
  /** ServiceWorker update behavior. Defaults to "all". */
  updateViaCache?: ServiceWorkerUpdateViaCache;
}

export function ServiceWorkerRegistrar({
  swPath = "/sw.js",
  updateViaCache = "none",
}: ServiceWorkerRegistrarProps) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register(swPath, {
          scope: "/",
          updateViaCache,
        });

        // Check for updates on each navigation (optional but recommended).
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // A new SW is available — you could emit a toast here.
              console.info("[PWA] New service worker available.");
            }
          });
        });
      } catch (error) {
        console.error("[PWA] Service worker registration failed:", error);
      }
    };

    // Delay registration until after load to not block LCP.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, [swPath, updateViaCache]);

  return null;
}