import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AnimatedPage from "@/components/admin/AnimatedPage";
import { useLanguageStore } from "@/i18n/store";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { useThemeStore } from "@/stores/useThemeStore";
import { useNotificationStore } from "@/data/notificationStore";
import { useContactLeadsStore } from "@/data/useContactLeadsStore";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import { useNutritionPlanStore } from "@/data/useNutritionPlanStore";
import { useTrainingPlanStore } from "@/data/useTrainingPlanStore";
import { useClientStore } from "@/data/useClientStore";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { userId } = useAuth();
  const setCurrentUser = useLanguageStore((s) => s.setCurrentUser);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchLeads = useContactLeadsStore((s) => s.fetchLeads);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);
  const generateWeeklyCheckins = useQuestionnaireStore((s) => s.generateWeeklyCheckins);
  const fetchClients = useClientStore((s) => s.fetchClients);
  const fetchNutritionPlans = useNutritionPlanStore((s) => s.fetchPlans);
  const fetchTrainingPlans = useTrainingPlanStore((s) => s.fetchPlans);

  useEffect(() => { if (userId) setCurrentUser(userId); }, [setCurrentUser, userId]);

  // Fetch notifications and leads on mount + poll every 60s
  useEffect(() => {
    fetchNotifications();
    fetchLeads();
    fetchClients();
    fetchNutritionPlans();
    fetchTrainingPlans();
    generateWeeklyCheckins().then(() => fetchEntries());

    const interval = setInterval(() => {
      fetchNotifications();
      fetchLeads();
    }, 60_000);

    return () => clearInterval(interval);
  }, [fetchNotifications, fetchLeads, fetchEntries, generateWeeklyCheckins, fetchClients, fetchNutritionPlans, fetchTrainingPlans]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Safe area spacer for Android/notch devices */}
        <div className="bg-card safe-area-top" />
        <AdminHeader />
        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <AnimatePresence mode="wait">
            <AnimatedPage key={location.pathname}>
              {children}
            </AnimatedPage>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
