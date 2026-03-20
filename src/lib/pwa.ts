export interface BeforeInstallPromptEvent extends Event {
  platforms: string[];
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

export const isStandaloneMode = () => {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as NavigatorWithStandalone).standalone === true
  );
};

export const isIOSDevice = () => {
  if (typeof window === "undefined") return false;

  return (
    /iPad|iPhone|iPod/.test(window.navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

export const isIosSafari = () => {
  if (typeof window === "undefined") return false;

  const ua = window.navigator.userAgent;
  return isIOSDevice() && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
};

export const getMobilePlatform = (): "ios" | "android" | "other" => {
  if (typeof window === "undefined") return "other";

  if (isIOSDevice()) return "ios";
  if (/Android/i.test(window.navigator.userAgent)) return "android";
  return "other";
};