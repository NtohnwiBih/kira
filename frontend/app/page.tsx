"use client";

/**
 * Example page demonstrating how to consume PWA install state
 * anywhere in the component tree via the usePwa() hook.
 */

import { usePwa } from "@/providers/PwaProvider";

export default function HomePage() {
  const { isInstalled, isPromptVisible, isMobile, handleInstall } = usePwa();

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <h1>PWA Demo</h1>

      <ul>
        <li>Installed: {String(isInstalled)}</li>
        <li>Prompt visible: {String(isPromptVisible)}</li>
        <li>Mobile: {String(isMobile)}</li>
      </ul>

      {!isInstalled && (
        <button
          onClick={handleInstall}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1.5rem",
            background: "#007aff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          Install App
        </button>
      )}
    </main>
  );
}