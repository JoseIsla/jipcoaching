import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { setInstallPrompt, type BeforeInstallPromptEvent } from "@/lib/pwa";
import App from "./App.tsx";
import "./index.css";

const clearLegacyApiCaches = async () => {
  if (!("caches" in window)) return;

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.includes("api-cache"))
      .map((key) => window.caches.delete(key)),
  );
};

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    setInstallPrompt(event as BeforeInstallPromptEvent);
  });

  window.addEventListener("appinstalled", () => {
    setInstallPrompt(null);
  });

  void clearLegacyApiCaches();
}

if ("serviceWorker" in navigator) {
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
      window.setInterval(() => registration.update(), 5 * 60 * 1000);
    },
    onRegisterError(error) {
      console.error("Error registrando el service worker", error);
    },
  });
}

createRoot(document.getElementById("root")!).render(<App />);
