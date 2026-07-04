"use client";

/**
 * @module PwaInstallPrompt
 * @description Pure UI component for the mobile PWA install bottom sheet.
 * Zero business logic — all behaviour is injected via props.
 */

import { useEffect, useRef } from "react";
import styles from "./PwaInstallPrompt.module.css";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PwaInstallPromptProps {
  /** Controls mount/visibility — parent is responsible for conditional rendering. */
  isVisible: boolean;
  /** Whether the native install dialog is open (disables buttons). */
  isInstalling: boolean;
  /** Fires when the user clicks "Install". */
  onInstall: () => void;
  /** Fires when the user dismisses the sheet. */
  onDismiss: () => void;
  // ── Customisable copy ──────────────────────────────────────────────────────
  appName?: string;
  appDescription?: string;
  appIconSrc?: string;
  installLabel?: string;
  dismissLabel?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PwaInstallPrompt({
  isVisible,
  isInstalling,
  onInstall,
  onDismiss,
  appName = "My App",
  appDescription = "Install for a faster, offline-ready experience.",
  appIconSrc = "/icons/icon-192x192.png",
  installLabel = "Install App",
  dismissLabel = "Not now",
}: PwaInstallPromptProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const installButtonRef = useRef<HTMLButtonElement>(null);

  // ── Trap focus inside the sheet when visible ──────────────────────────────

  useEffect(() => {
    if (!isVisible) return;

    // Move focus to the install button on open.
    installButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();

      if (e.key !== "Tab" || !sheetRef.current) return;

      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onDismiss]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        aria-hidden="true"
        onClick={onDismiss}
      />

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-prompt-title"
        aria-describedby="pwa-prompt-description"
        className={styles.sheet}
      >
        {/* Drag handle (decorative) */}
        <div className={styles.handle} aria-hidden="true" />

        {/* Content row */}
        <div className={styles.content}>
          {/* App icon */}
          <img
            src={appIconSrc}
            alt={`${appName} icon`}
            className={styles.icon}
            width={56}
            height={56}
            loading="eager"
          />

          {/* Copy */}
          <div className={styles.copy}>
            <p id="pwa-prompt-title" className={styles.title}>
              {appName}
            </p>
            <p id="pwa-prompt-description" className={styles.description}>
              {appDescription}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            ref={installButtonRef}
            type="button"
            className={styles.installButton}
            onClick={onInstall}
            disabled={isInstalling}
            aria-busy={isInstalling}
            aria-label={`Install ${appName}`}
          >
            {isInstalling ? (
              <>
                <span className={styles.spinner} aria-hidden="true" />
                Installing…
              </>
            ) : (
              installLabel
            )}
          </button>

          <button
            type="button"
            className={styles.dismissButton}
            onClick={onDismiss}
            disabled={isInstalling}
            aria-label="Dismiss install prompt"
          >
            {dismissLabel}
          </button>
        </div>
      </div>
    </>
  );
}