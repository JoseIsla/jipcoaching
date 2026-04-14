/**
 * Dev Mode Configuration
 * 
 * When DEV_MOCK is true, the app uses mock data and bypasses real API calls.
 * Set VITE_DEV_MOCK=true in .env or it defaults to true when no VITE_API_URL is set.
 */

export const DEV_MOCK =
  import.meta.env.VITE_DEV_MOCK === "true" ||
  (!import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL);

/**
 * Demo Mode – activated at runtime via special login credentials.
 * Uses mock data like DEV_MOCK but works in production builds.
 * Stored in sessionStorage so it survives navigation but not tab close.
 */
export const isDemoMode = (): boolean => {
  try {
    return sessionStorage.getItem("demoMode") === "true";
  } catch {
    return false;
  }
};

/** Enable demo mode (called on demo login) */
export const enableDemoMode = () => {
  try { sessionStorage.setItem("demoMode", "true"); } catch {}
};

/** Disable demo mode (called on logout) */
export const disableDemoMode = () => {
  try { sessionStorage.removeItem("demoMode"); } catch {}
};

/** Returns true if either DEV_MOCK or demo mode is active */
export const isLocalMode = (): boolean => DEV_MOCK || isDemoMode();

/** Dev credentials */
export const DEV_USERS = {
  admin: {
    email: "admin@jipcoaching.com",
    password: "admin123",
    userId: "dev-admin-001",
    role: "admin" as const,
    name: "Javier Ibáñez",
  },
  client: {
    email: "carlos@email.com",
    password: "client123",
    userId: "1",
    role: "client" as const,
    name: "Carlos Martínez",
  },
};

/** Demo credentials for commercial presentations */
export const DEMO_USERS = {
  admin: {
    email: "demo@jipcoaching.com",
    password: "demo2025",
    userId: "demo-admin-001",
    role: "admin" as const,
    name: "Coach Demo",
  },
  client: {
    email: "carlos@demo.com",
    password: "demo2025",
    userId: "1",
    role: "client" as const,
    name: "Carlos Martínez",
  },
};
