import { type ReactNode, useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Dumbbell, ClipboardList, BarChart3, Home, Settings, LogOut, Loader2, Bell } from "lucide-react";
import PullToRefresh from "./PullToRefresh";
import { useClient } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore } from "@/i18n/store";
import { useClientNotificationStore } from "@/data/useClientNotificationStore";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useToast } from "@/hooks/use-toast";

const ClientLayout = ({ children }: { children: ReactNode }) => {
  const setCurrentUser = useLanguageStore((s) => s.setCurrentUser);
  const { t } = useTranslation();
  const { client, setClientId, allClients } = useClient();
  const { logout, userId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const toastShownRef = useRef(false);

  useEffect(() => { if (userId) setCurrentUser(userId); }, [setCurrentUser, userId]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Notification store
  const notifications = useClientNotificationStore((s) => s.notifications);
  const generateForClient = useClientNotificationStore((s) => s.generateForClient);
  const markAllRead = useClientNotificationStore((s) => s.markAllRead);
  const unreadCount = useClientNotificationStore((s) => s.getUnreadCount());

  // Get pending check-in entries for this client
  const allEntries = useQuestionnaireStore((s) => s.entries);
  const pendingEntries = allEntries.filter(
    (e) => e.clientId === client.id && e.status === "pendiente"
  );
  const pendingNutrition = pendingEntries.filter((e) => e.category === "nutrition");
  const pendingTraining = pendingEntries.filter((e) => e.category === "training");

  // Generate notifications based on services and pending check-ins
  useEffect(() => {
    const pendingIds = pendingEntries.map((e) => e.id);
    // Only generate if there are actually pending check-ins
    if (pendingIds.length > 0) {
      // Build notifications based on what's actually pending
      const notifs: import("@/data/useClientNotificationStore").ClientNotification[] = [];
      const now = new Date();

      if (pendingNutrition.length > 0 && client.services?.includes("nutrition")) {
        notifs.push({
          id: `cn-${client.id}-nutrition-${now.getTime()}`,
          type: "nutrition_checkin",
          titleKey: "clientNotifications.nutritionCheckinTitle",
          descriptionKey: "clientNotifications.nutritionCheckinDesc",
          timestamp: now,
          read: false,
          link: "/client/checkins",
        });
      }

      if (pendingTraining.length > 0 && client.services?.includes("training")) {
        notifs.push({
          id: `cn-${client.id}-training-${now.getTime()}`,
          type: "training_checkin",
          titleKey: "clientNotifications.trainingCheckinTitle",
          descriptionKey: "clientNotifications.trainingCheckinDesc",
          timestamp: now,
          read: false,
          link: "/client/checkins",
        });
      }

      // Only update if different count (avoid infinite loop)
      if (notifs.length !== notifications.length) {
        useClientNotificationStore.setState({ notifications: notifs });
      }
    } else if (notifications.length > 0) {
      // No pending → clear notifications (auto-dismiss)
      useClientNotificationStore.getState().clear();
    }
  }, [client.id, client.services, pendingEntries.length, pendingNutrition.length, pendingTraining.length, notifications.length]);

  // Auto-toast on entry when there are pending check-ins
  useEffect(() => {
    if (toastShownRef.current) return;
    if (pendingEntries.length > 0) {
      toastShownRef.current = true;
      toast({
        title: t("clientNotifications.pendingReminder", { n: String(pendingEntries.length) }),
        description: t("clientNotifications.goToCheckins"),
        duration: 5000,
      });
    }
  }, [client.id]);

  // Reset toast flag when client changes
  useEffect(() => {
    toastShownRef.current = false;
  }, [client.id]);

  const tabs = [
    { label: t("clientNav.home"), icon: Home, path: "/client" },
    { label: t("clientNav.nutrition"), icon: Utensils, path: "/client/nutrition", service: "nutrition" as const },
    { label: t("clientNav.training"), icon: Dumbbell, path: "/client/training", service: "training" as const },
    { label: t("clientNav.checkins"), icon: ClipboardList, path: "/client/checkins" },
    { label: t("clientNav.progress"), icon: BarChart3, path: "/client/progress" },
    { label: t("clientNav.settings"), icon: Settings, path: "/client/settings" },
  ];

  const initials = (client.name ?? "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

  const visibleTabs = tabs.filter(
    (tab) => !tab.service || (client.services ?? []).includes(tab.service)
  );

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    useClientNotificationStore.getState().clear();
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
              {(client.services ?? []).map((s) => (
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
          {/* Bell icon with notification badge */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-card border-border" align="end" sideOffset={8}>
              <div className="p-3 border-b border-border flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{t("clientNotifications.title")}</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {t("clientNotifications.markAll")}
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center">
                    <Bell className="h-6 w-6 text-muted-foreground mx-auto mb-1.5" />
                    <p className="text-xs text-muted-foreground">{t("clientNotifications.noNotifications")}</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        useClientNotificationStore.getState().markRead(notif.id);
                        navigate(notif.link);
                      }}
                      className={`w-full text-left p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors ${
                        notif.read ? "opacity-60" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground">{t(notif.titleKey, notif.titleVars)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(notif.descriptionKey, notif.descriptionVars)}</p>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-primary"
                    onClick={() => navigate("/client/checkins")}
                  >
                    {t("clientNotifications.goToCheckins")}
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>

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
            // Show badge on checkins tab if there are pending entries
            const showBadge = tab.path === "/client/checkins" && pendingEntries.length > 0;
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
                <div className="relative">
                  <tab.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1.5 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold flex items-center justify-center">
                      {pendingEntries.length}
                    </span>
                  )}
                </div>
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
