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

const PREVIEW_HOST_PATTERNS = [/\.lovableproject\.com$/i, /^localhost$/i, /^127\.0\.0\.1$/i];

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;

export const shouldEnableServiceWorker = () => {
  if (typeof window === "undefined") return false;
  if (!import.meta.env.PROD) return false;

  return !PREVIEW_HOST_PATTERNS.some((pattern) => pattern.test(window.location.hostname));
};

export const clearPwaCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
};

export const clearLegacyApiCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.includes("api-cache"))
      .map((key) => window.caches.delete(key)),
  );
};

export const unregisterServiceWorkers = async () => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));
};

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