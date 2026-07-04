export {
  clearDismissalRecord,
  isCooldownElapsed,
  isMobileDevice,
  isRunningAsInstalled,
  readDismissalRecord,
  triggerInstallPrompt,
  writeDismissalRecord,
} from "./install-manager";

export type {
  BeforeInstallPromptEvent,
  DismissalRecord,
  InstallOutcome,
} from "./install-manager";