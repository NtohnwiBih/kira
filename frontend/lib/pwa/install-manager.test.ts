/**
 * Unit tests for install-manager utilities.
 * Run with: npx jest lib/pwa/install-manager.test.ts
 */

import {
  clearDismissalRecord,
  isCooldownElapsed,
  readDismissalRecord,
  writeDismissalRecord,
  type DismissalRecord,
} from "./install-manager";

// ─── Mock localStorage ────────────────────────────────────────────────────────

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("install-manager", () => {
  beforeEach(() => localStorageMock.clear());

  describe("readDismissalRecord", () => {
    it("returns null when no record exists", () => {
      expect(readDismissalRecord()).toBeNull();
    });

    it("returns the stored record", () => {
      const record: DismissalRecord = {
        dismissedAt: new Date().toISOString(),
        dismissCount: 1,
      };
      localStorageMock.setItem("pwa:dismissal", JSON.stringify(record));
      expect(readDismissalRecord()).toEqual(record);
    });

    it("returns null for malformed JSON", () => {
      localStorageMock.setItem("pwa:dismissal", "not-json{{{");
      expect(readDismissalRecord()).toBeNull();
    });
  });

  describe("writeDismissalRecord", () => {
    it("writes a record with dismissCount 1 on first call", () => {
      writeDismissalRecord();
      const record = readDismissalRecord();
      expect(record?.dismissCount).toBe(1);
      expect(record?.dismissedAt).toBeDefined();
    });

    it("increments dismissCount on subsequent calls", () => {
      writeDismissalRecord();
      writeDismissalRecord();
      expect(readDismissalRecord()?.dismissCount).toBe(2);
    });
  });

  describe("clearDismissalRecord", () => {
    it("removes the record", () => {
      writeDismissalRecord();
      clearDismissalRecord();
      expect(readDismissalRecord()).toBeNull();
    });
  });

  describe("isCooldownElapsed", () => {
    it("returns true when no record exists", () => {
      expect(isCooldownElapsed()).toBe(true);
    });

    it("returns false when dismissed less than cooldown ago", () => {
      writeDismissalRecord();
      expect(isCooldownElapsed(1_000 * 60 * 60 * 24 * 7)).toBe(false);
    });

    it("returns true when cooldown has elapsed", () => {
      const past = new Date(Date.now() - 10_000).toISOString();
      localStorageMock.setItem(
        "pwa:dismissal",
        JSON.stringify({ dismissedAt: past, dismissCount: 1 })
      );
      expect(isCooldownElapsed(5_000)).toBe(true);
    });
  });
});