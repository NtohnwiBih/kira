"use client";

/**
 * @module PwaProvider
 * @description Provides PWA install state globally via React context.
 * Wrap your root layout with this provider to make install state available
 * anywhere in the tree without prop-drilling.
 */

import { createContext, useContext, type ReactNode } from "react";
import { usePwaInstall, type UsePwaInstallReturn } from "@/hooks/use-pwa-install";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

// ─── Context ──────────────────────────────────────────────────────────────────

const PwaContext = createContext<UsePwaInstallReturn | null>(null);

// ─── Hook (consumer) ──────────────────────────────────────────────────────────

/**
 * Returns the PWA install state and actions from the nearest PwaProvider.
 * Throws if used outside a PwaProvider.
 */
export function usePwa(): UsePwaInstallReturn {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error("usePwa must be used inside <PwaProvider>.");
  }
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface PwaProviderProps {
  children: ReactNode;
  /** Override the 7-day cooldown (useful for testing). */
  cooldownMs?: number;
  // ── Prompt copy overrides ──────────────────────────────────────────────────
  appName?: string;
  appDescription?: string;
  appIconSrc?: string;
}

export function PwaProvider({
  children,
  cooldownMs,
  appName,
  appDescription,
  appIconSrc,
}: PwaProviderProps) {
  const install = usePwaInstall({ cooldownMs });

  return (
    <PwaContext.Provider value={install}>
      {children}

      {/* The prompt is rendered at provider level to guarantee it overlays everything. */}
      <PwaInstallPrompt
        isVisible={install.isPromptVisible}
        isInstalling={install.isInstalling}
        onInstall={install.handleInstall}
        onDismiss={install.handleDismiss}
        appName={appName}
        appDescription={appDescription}
        appIconSrc={appIconSrc}
      />
    </PwaContext.Provider>
  );
}