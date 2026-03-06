import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { ApiClient } from "@/types/api";
import { isClientActive, getServicesFromPack } from "@/types/api";
import { useClientStore } from "@/data/useClientStore";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";


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
  const [selfClient, setSelfClient] = useState<ApiClient | null>(null);

  const fetchNutritionPlans = useNutritionPlanStore((s) => s.fetchPlans);
  const fetchTrainingPlans = useTrainingPlanStore((s) => s.fetchPlans);

  // For CLIENT role, fetch their own client record from /api/clients/me
  useEffect(() => {
    if (status !== "authenticated" || role !== "client") return;

    api.get<any>("/clients/me", { silent: true }).then((data) => {
      if (data?.id) {
        const enriched: ApiClient = {
          id: data.id,
          name: data.name ?? "Sin nombre",
          email: data.email ?? "",
          packType: data.packType,
          status: data.status,
          monthlyFee: data.monthlyFee,
          notes: data.notes,
          avatarUrl: data.avatarUrl,
          services: getServicesFromPack(data.packType),
        };
        setSelfClient(enriched);
        setClientId(data.id);

        // Fetch plans for this client
        fetchTrainingPlans();
        fetchNutritionPlans();
      }
    }).catch((err) => {
      console.warn("Failed to fetch client profile:", err?.message);
    });
  }, [status, role]);

  // Fetch clients only for admin — /api/clients is admin-only
  useEffect(() => {
    if (status === "authenticated" && role === "admin") {
      fetchClients();
    }
  }, [status, role, fetchClients]);

  const client = (() => {
    // Client role: use self-fetched data
    if (role === "client" && selfClient) return selfClient;
    // Admin role: use selected or first active
    if (clientId) return allStoreClients.find((c) => c.id === clientId) ?? FALLBACK_CLIENT;
    return activeClients[0] ?? FALLBACK_CLIENT;
  })();

  return (
    <ClientContext.Provider value={{ client, setClientId, allClients: activeClients }}>
      {children}
    </ClientContext.Provider>
  );
};
