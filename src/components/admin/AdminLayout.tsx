import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import AnimatedPage from "@/components/admin/AnimatedPage";
import { useLanguageStore } from "@/i18n/store";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationStore } from "@/data/notificationStore";
import { useContactLeadsStore } from "@/data/useContactLeadsStore";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { userId } = useAuth();
  const setCurrentUser = useLanguageStore((s) => s.setCurrentUser);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  const fetchLeads = useContactLeadsStore((s) => s.fetchLeads);

  useEffect(() => { if (userId) setCurrentUser(userId); }, [setCurrentUser, userId]);

  // Fetch notifications and leads on admin panel mount
  useEffect(() => {
    fetchNotifications();
    fetchLeads();
  }, [fetchNotifications, fetchLeads]);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
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
