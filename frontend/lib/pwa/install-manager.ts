/**
 * @module install-manager
 * @description Low-level PWA installation utilities.
 * No React, no side-effects — pure browser logic.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface DismissalRecord {
  /** ISO timestamp of when the user last dismissed the prompt. */
  dismissedAt: string;
  /** How many times the user has dismissed in total. */
  dismissCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "pwa:dismissal" as const;
const COOLDOWN_MS_DEFAULT = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Storage helpers ──────────────────────────────────────────────────────────

/** Reads the raw dismissal record from localStorage, or null if absent / invalid. */
export function readDismissalRecord(): DismissalRecord | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DismissalRecord;
  } catch {
    return null;
  }
}

/** Persists a new dismissal record to localStorage. */
export function writeDismissalRecord(): void {
  if (typeof window === "undefined") return;

  const existing = readDismissalRecord();
  const record: DismissalRecord = {
    dismissedAt: new Date().toISOString(),
    dismissCount: (existing?.dismissCount ?? 0) + 1,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/** Clears the dismissal record (useful for testing or "reset" flows). */
export function clearDismissalRecord(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ─── Eligibility checks ───────────────────────────────────────────────────────

/**
 * Returns true if the cooldown period since last dismissal has elapsed.
 * @param cooldownMs   Override the default 7-day cooldown.
 */
export function isCooldownElapsed(cooldownMs = COOLDOWN_MS_DEFAULT): boolean {
  const record = readDismissalRecord();
  if (!record) return true;

  const dismissedAt = new Date(record.dismissedAt).getTime();
  return Date.now() - dismissedAt >= cooldownMs;
}

/** Returns true if the app is running in standalone / installed mode. */
export function isRunningAsInstalled(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** Returns true when the current device is mobile (touch + narrow viewport). */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isNarrow = window.innerWidth <= 768;
  return hasTouch && isNarrow;
}

// ─── Installation trigger ─────────────────────────────────────────────────────

/**
 * Calls `.prompt()` on the deferred `BeforeInstallPromptEvent` and resolves
 * with the user's choice outcome.
 */
export async function triggerInstallPrompt(
  deferredEvent: BeforeInstallPromptEvent
): Promise<InstallOutcome> {
  try {
    await deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    return outcome;
  } catch {
    return "unavailable";
  }
}