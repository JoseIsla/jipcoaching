import { type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Utensils, Dumbbell, ClipboardList, BarChart3, Home, Settings, LogOut } from "lucide-react";
import { useClient } from "@/contexts/ClientContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const tabs = [
  { label: "Inicio", icon: Home, path: "/client" },
  { label: "Nutrición", icon: Utensils, path: "/client/nutrition", service: "nutrition" as const },
  { label: "Entreno", icon: Dumbbell, path: "/client/training", service: "training" as const },
  { label: "Check-in", icon: ClipboardList, path: "/client/checkins" },
  { label: "Progreso", icon: BarChart3, path: "/client/progress" },
  { label: "Ajustes", icon: Settings, path: "/client/settings" },
];

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const { client, setClientId, allClients } = useClient();
  const location = useLocation();
  const navigate = useNavigate();

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const visibleTabs = tabs.filter(
    (t) => !t.service || client.services.includes(t.service)
  );

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border border-primary/30">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-foreground font-semibold text-sm leading-tight truncate">{client.name}</span>
            <span className="text-muted-foreground text-[10px] leading-tight">{client.plan}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={client.id} onValueChange={setClientId}>
            <SelectTrigger className="w-36 h-8 text-xs bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allClients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20 px-4 py-5">
        {children}
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {visibleTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ClientLayout;
