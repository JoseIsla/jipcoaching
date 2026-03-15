import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Dumbbell,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Library,
  Menu,
  X,
  Inbox,
  Mail,
  TrendingUp,
} from "lucide-react";
import logoJip from "@/assets/logo-jip.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/i18n/useTranslation";

const navKeys = [
  { key: "sidebar.dashboard", icon: LayoutDashboard, path: "/admin" },
  { key: "sidebar.clients", icon: Users, path: "/admin/clients" },
  { key: "sidebar.nutrition", icon: Utensils, path: "/admin/nutrition" },
  { key: "sidebar.training", icon: Dumbbell, path: "/admin/training" },
  { key: "sidebar.checkins", icon: FileCheck, path: "/admin/checkins" },
  { key: "sidebar.progress", icon: TrendingUp, path: "/admin/progress" },
  { key: "sidebar.library", icon: Library, path: "/admin/exercises" },
  { key: "sidebar.leads", icon: Inbox, path: "/admin/leads" },
  { key: "sidebar.questionnaires", icon: ClipboardList, path: "/admin/questionnaires" },
  { key: "sidebar.emails", icon: Mail, path: "/admin/emails" },
  { key: "sidebar.settings", icon: Settings, path: "/admin/settings" },
];

export const MobileMenuButton = () => {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("toggle-admin-sidebar"))}
      className="text-muted-foreground hover:text-foreground transition-colors lg:hidden"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
};

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v);
    window.addEventListener("toggle-admin-sidebar", handler);
    return () => window.removeEventListener("toggle-admin-sidebar", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavItems = (showLabel: boolean) =>
    navKeys.map((item) => {
      const isActive = location.pathname === item.path;
      return (
        <NavLink
          key={item.path}
          to={item.path}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
            isActive
              ? "bg-sidebar-accent text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <item.icon className={`h-5 w-5 shrink-0 ${isActive ? "text-primary" : ""}`} />
          {showLabel && <span>{t(item.key)}</span>}
        </NavLink>
      );
    });

  if (!isMobile) {
    return (
      <aside
        className={`${
          collapsed ? "w-[72px]" : "w-64"
        } bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="flex items-center justify-center h-20 border-b border-sidebar-border px-4">
          {!collapsed ? (
            <img src={logoJip} alt="JIP" className="h-12 w-auto" />
          ) : (
            <span className="text-primary font-black text-xl">J</span>
          )}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {renderNavItems(!collapsed)}
        </nav>
        <div className="border-t border-sidebar-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 border-b border-sidebar-border px-4">
          <img src={logoJip} alt="JIP" className="h-10 w-auto" />
          <button
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {renderNavItems(true)}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
