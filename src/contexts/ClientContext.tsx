import { createContext, forwardRef, useContext, useState, useEffect, type ReactNode } from "react";
import type { ApiClient } from "@/types/api";
import { isClientActive, getServicesFromPack } from "@/types/api";
import { useClientStore } from "@/data/useClientStore";
import { useAuth } from "@/contexts/AuthContext";
import { api, API_BASE_URL } from "@/services/api";
import { isLocalMode } from "@/config/devMode";
import { mockClients } from "@/data/mockClients";

/** Resolve relative upload URLs to full server URLs */
const resolveUrl = (url: string | null | undefined): string | undefined => {
  if (!url || url.startsWith("http") || url.startsWith("blob:")) return url || undefined;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${serverRoot}${url}`;
};
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";


interface ClientContextType {
  client: ApiClient;
  setClientId: (id: string) => void;
  allClients: ApiClient[];
  updateClientAvatar: (url: string | null) => void;
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

    if (isLocalMode()) {
      const demoClient =
        allStoreClients.find((c) => c.id === userId) ??
        mockClients.find((c) => c.id === userId) ??
        mockClients[0];

      if (demoClient) {
        setSelfClient(demoClient);
        setClientId(demoClient.id);
        fetchTrainingPlans();
        fetchNutritionPlans();
      }

      return;
    }

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
          avatarUrl: resolveUrl(data.avatarUrl),
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
  }, [status, role, userId, allStoreClients, fetchNutritionPlans, fetchTrainingPlans]);

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

  const updateClientAvatar = (url: string | null) => {
    setSelfClient((prev) => prev ? { ...prev, avatarUrl: url ?? undefined } : prev);
  };

  return (
    <ClientContext.Provider value={{ client, setClientId, allClients: activeClients, updateClientAvatar }}>
      {children}
    </ClientContext.Provider>
  );
});

ClientProvider.displayName = "ClientProvider";
