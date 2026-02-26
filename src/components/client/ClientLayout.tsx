import { type ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Dumbbell, ClipboardList, BarChart3, Home, Settings, LogOut, Loader2 } from "lucide-react";
import PullToRefresh from "./PullToRefresh";
import { useClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/i18n/store";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const setCurrentRole = useLanguageStore((s) => s.setCurrentRole);
  useEffect(() => { setCurrentRole("client"); }, [setCurrentRole]);
  const { t } = useTranslation();
  const { client, setClientId, allClients } = useClient();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { label: t("clientNav.home"), icon: Home, path: "/client" },
    { label: t("clientNav.nutrition"), icon: Utensils, path: "/client/nutrition", service: "nutrition" as const },
    { label: t("clientNav.training"), icon: Dumbbell, path: "/client/training", service: "training" as const },
    { label: t("clientNav.checkins"), icon: ClipboardList, path: "/client/checkins" },
    { label: t("clientNav.progress"), icon: BarChart3, path: "/client/progress" },
    { label: t("clientNav.settings"), icon: Settings, path: "/client/settings" },
  ];

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const visibleTabs = tabs.filter(
    (tab) => !tab.service || client.services.includes(tab.service)
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
    setIsLoggingOut(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-3 sm:px-4 py-2.5 flex items-center justify-between shrink-0 safe-area-top">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Avatar className="h-8 w-8 border border-primary/30 shrink-0">
            <AvatarImage src={undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-foreground font-semibold text-sm leading-tight truncate">{client.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {client.services.map((s) => (
                <span
                  key={s}
                  className="text-[10px] leading-tight text-primary/80 font-medium"
                >
                  {s === "nutrition" ? `🍎 ${t("common.nutrition")}` : `🏋️ ${t("common.training")}`}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Select value={client.id} onValueChange={setClientId}>
            <SelectTrigger className="w-28 sm:w-36 h-8 text-xs bg-background border-border">
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
            disabled={isLoggingOut}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-70"
            title={t("common.logout")}
          >
            {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24 px-3 sm:px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <PullToRefresh>
              {children}
            </PullToRefresh>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50 safe-area-bottom">
        <div className="flex items-center justify-around py-1.5 max-w-lg mx-auto">
          {visibleTabs.map((tab) => {
            const isActive = location.pathname === tab.path;
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={`relative flex flex-col items-center gap-0.5 px-1.5 py-1 rounded-lg transition-all ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                <tab.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : ""}`}>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-px inset-x-0 mx-auto w-8 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ClientLayout;
