import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ApiClient } from "@/types/api";
import { isClientActive } from "@/types/api";
import { useClientStore } from "@/data/useClientStore";
import { useAuth } from "@/contexts/AuthContext";


interface ClientContextType {
  client: ApiClient;
  setClientId: (id: string) => void;
  allClients: ApiClient[];
}

const FALLBACK_CLIENT: ApiClient = {
  id: "unknown",
  name: "Cargando…",
  email: "",
  services: [],
};

const ClientContext = createContext<ClientContextType | null>(null);

export const useClient = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be inside ClientProvider");
  return ctx;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const { status, role, userId } = useAuth();
  const allStoreClients = useClientStore((s) => s.clients);
  const fetchClients = useClientStore((s) => s.fetchClients);
  const activeClients = allStoreClients.filter((c) => isClientActive(c.status));
  const [clientId, setClientId] = useState<string | null>(null);

  // For CLIENT role, the user IS the client
  useEffect(() => {
    if (role === "client" && userId) {
      setClientId(userId);
    }
  }, [role, userId]);

  // Fetch clients only for admin — /api/clients is admin-only
  useEffect(() => {
    if (status === "authenticated" && role === "admin") {
      fetchClients();
    }
  }, [status, role, fetchClients]);

  const client = clientId
    ? allStoreClients.find((c) => c.id === clientId) ?? FALLBACK_CLIENT
    : activeClients[0] ?? FALLBACK_CLIENT;

  return (
    <ClientContext.Provider value={{ client, setClientId, allClients: activeClients }}>
      {children}
    </ClientContext.Provider>
  );
};
