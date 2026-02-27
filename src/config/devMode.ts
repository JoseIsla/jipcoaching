/**
 * Dev Mode Configuration
 * 
 * When DEV_MOCK is true, the app uses mock data and bypasses real API calls.
 * Set VITE_DEV_MOCK=true in .env or it defaults to true when no VITE_API_URL is set.
 */

export const DEV_MOCK =
  import.meta.env.VITE_DEV_MOCK === "true" ||
  (!import.meta.env.VITE_API_URL && !import.meta.env.VITE_API_BASE_URL);

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
