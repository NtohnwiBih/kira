"use client";

/**
 * @module usePwaInstall
 * @description Encapsulates all PWA install lifecycle logic.
 * Components consume this hook — they never touch the browser API directly.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BeforeInstallPromptEvent,
  type InstallOutcome,
  isCooldownElapsed,
  isMobileDevice,
  isRunningAsInstalled,
  triggerInstallPrompt,
  writeDismissalRecord,
} from "@/lib/pwa/install-manager";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PwaInstallState {
  /** True when the install prompt can be shown to the user. */
  isPromptVisible: boolean;
  /** True when the native install dialog is currently open. */
  isInstalling: boolean;
  /** True when the app is already installed / running in standalone mode. */
  isInstalled: boolean;
  /** True when the device qualifies for showing the prompt. */
  isMobile: boolean;
}

export interface PwaInstallActions {
  /** Triggers the native install flow. */
  handleInstall: () => Promise<void>;
  /** Dismisses the prompt and records the cooldown timestamp. */
  handleDismiss: () => void;
}

export type UsePwaInstallReturn = PwaInstallState & PwaInstallActions;

// ─── Config ───────────────────────────────────────────────────────────────────

interface UsePwaInstallOptions {
  /** Cooldown in ms before the prompt can reappear after dismissal. Default: 7 days. */
  cooldownMs?: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePwaInstall(options: UsePwaInstallOptions = {}): UsePwaInstallReturn {
  const { cooldownMs } = options;

  const deferredEventRef = useRef<BeforeInstallPromptEvent | null>(null);

  const [isPromptVisible, setIsPromptVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // ── Initialise client-only state ──────────────────────────────────────────

  useEffect(() => {
    setIsMobile(isMobileDevice());
    setIsInstalled(isRunningAsInstalled());
  }, []);

  // ── Listen for the deferred install prompt ────────────────────────────────

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault(); // Prevent the default mini-infobar on mobile Chrome.

      const promptEvent = event as BeforeInstallPromptEvent;
      deferredEventRef.current = promptEvent;

      const shouldShow =
        isMobileDevice() &&
        !isRunningAsInstalled() &&
        isCooldownElapsed(cooldownMs);

      if (shouldShow) {
        setIsPromptVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [cooldownMs]);

  // ── Listen for the appinstalled event ────────────────────────────────────

  useEffect(() => {
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsPromptVisible(false);
      deferredEventRef.current = null;
    };

    window.addEventListener("appinstalled", handleAppInstalled);
    return () => window.removeEventListener("appinstalled", handleAppInstalled);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleInstall = useCallback(async () => {
    const event = deferredEventRef.current;
    if (!event) return;

    setIsInstalling(true);

    const outcome: InstallOutcome = await triggerInstallPrompt(event);

    setIsInstalling(false);

    if (outcome === "accepted") {
      setIsInstalled(true);
      setIsPromptVisible(false);
      deferredEventRef.current = null;
    } else {
      // User cancelled inside the native dialog — treat as dismiss.
      writeDismissalRecord();
      setIsPromptVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    writeDismissalRecord();
    setIsPromptVisible(false);
  }, []);

  return {
    isPromptVisible,
    isInstalling,
    isInstalled,
    isMobile,
    handleInstall,
    handleDismiss,
  };
}