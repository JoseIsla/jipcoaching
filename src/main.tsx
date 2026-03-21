import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import {
  clearPwaCaches,
  migrateLegacyPwaCaches,
  setInstallPrompt,
  shouldEnableServiceWorker,
  unregisterServiceWorkers,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";
import App from "./App.tsx";
import "./index.css";

const setupServiceWorker = async () => {
  await migrateLegacyPwaCaches();

  if (!("serviceWorker" in navigator)) return;

  if (!shouldEnableServiceWorker()) {
    await unregisterServiceWorkers();
    await clearPwaCaches();
    return;
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      window.dispatchEvent(
        new CustomEvent("app-update-available", {
          detail: {
            update: () => updateSW(true),
          },
        }),
      );
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;

      const triggerUpdateCheck = () => {
        if (navigator.onLine) void registration.update();
      };

      window.setInterval(triggerUpdateCheck, 5 * 60 * 1000);
      window.addEventListener("online", triggerUpdateCheck);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") triggerUpdateCheck();
      });
    },
    onRegisterError(error) {
      console.error("Error registrando el service worker", error);
    },
  });
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setInstallPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    setInstallPrompt(null);
  });

  void setupServiceWorker();
}

createRoot(document.getElementById("root")!).render(<App />);
