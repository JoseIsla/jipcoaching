import { createContext, useContext, useState, type ReactNode } from "react";
import { type Client } from "@/data/mockData";
import { useClientStore } from "@/data/useClientStore";

interface ClientContextType {
  client: Client;
  setClientId: (id: string) => void;
  allClients: Client[];
}

const ClientContext = createContext<ClientContextType | null>(null);

export const useClient = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error("useClient must be inside ClientProvider");
  return ctx;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const allStoreClients = useClientStore((s) => s.clients);
  const activeClients = allStoreClients.filter((c) => c.status === "Activo");
  const [clientId, setClientId] = useState(activeClients[0]?.id || "1");
  const client = allStoreClients.find((c) => c.id === clientId) || activeClients[0];

  return (
    <ClientContext.Provider value={{ client, setClientId, allClients: activeClients }}>
      {children}
    </ClientContext.Provider>
  );
};
