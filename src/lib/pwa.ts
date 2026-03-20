export type Platform = "ios" | "android" | "other";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }

  interface Window {
    MSStream?: unknown;
  }

  interface WindowEventMap {
    "app-update-available": CustomEvent<{ update?: () => Promise<void> }>;
    "app-install-prompt-change": CustomEvent<{ canInstall: boolean }>;
  }
}

export const INSTALL_PROMPT_EVENT = "app-install-prompt-change";

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

export const isSafari = () => /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|Chrome|EdgiOS/.test(navigator.userAgent);

export const detectPlatform = (): Platform => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
};

const notifyInstallPromptChange = () => {
  window.dispatchEvent(
    new CustomEvent(INSTALL_PROMPT_EVENT, {
      detail: { canInstall: Boolean(deferredInstallPrompt) },
    }),
  );
};

export const setInstallPrompt = (event: BeforeInstallPromptEvent | null) => {
  deferredInstallPrompt = event;
  notifyInstallPromptChange();
};

export const canPromptInstall = () => Boolean(deferredInstallPrompt);

export const promptInstall = async () => {
  if (!deferredInstallPrompt) return false;

  const installPrompt = deferredInstallPrompt;
  deferredInstallPrompt = null;
  notifyInstallPromptChange();

  await installPrompt.prompt();
  const choice = await installPrompt.userChoice.catch(() => null);
  return choice?.outcome === "accepted";
};