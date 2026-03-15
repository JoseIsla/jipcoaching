import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Library,
  Menu,
  X,
  Inbox,
  Mail,
  TrendingUp,
  FileCheck,
  Activity,
} from "lucide-react";
import logoJip from "@/assets/logo-jip.png";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/i18n/useTranslation";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";

type NavItem = { key: string; icon: typeof LayoutDashboard; path: string; badge?: boolean };
type NavGroup = { groupKey: string; icon: typeof Activity; children: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (entry: NavEntry): entry is NavGroup => "children" in entry;

/** Animated badge that bounces when count changes */
const AnimatedBadge = ({ count, size = "md" }: { count: number; size?: "sm" | "md" }) => {
  const prevCount = useRef(count);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (count !== prevCount.current) {
      setKey((k) => k + 1);
      prevCount.current = count;
    }
  }, [count]);

  const sizeClasses = size === "sm"
    ? "h-4 min-w-4 px-0.5 text-[10px] -top-1.5 -right-1.5"
    : "h-5 min-w-5 px-1 text-[10px]";

  return (
    <AnimatePresence mode="wait">
      {count > 0 && (
        <motion.span
          key={key}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className={`${sizeClasses} flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold`}
        >
          {count}
        </motion.span>
      )}
    </AnimatePresence>
  );
};

const navEntries: NavEntry[] = [
  { key: "sidebar.dashboard", icon: LayoutDashboard, path: "/admin" },
  { key: "sidebar.clients", icon: Users, path: "/admin/clients" },
  { key: "sidebar.nutrition", icon: Utensils, path: "/admin/nutrition" },
  { key: "sidebar.training", icon: Dumbbell, path: "/admin/training" },
  {
    groupKey: "sidebar.tracking",
    icon: Activity,
    children: [
      { key: "sidebar.checkins", icon: FileCheck, path: "/admin/checkins", badge: true },
      { key: "sidebar.progress", icon: TrendingUp, path: "/admin/progress" },
    ],
  },
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

  const pendingReviewCount = useQuestionnaireStore((s) =>
    s.entries.filter((e) => e.status === "respondido").length
  );

  // Auto-open tracking group if a child is active
  const isChildActive = (group: NavGroup) =>
    group.children.some((c) => location.pathname === c.path);

  const [trackingOpen, setTrackingOpen] = useState(() =>
    navEntries.some((e) => isGroup(e) && isChildActive(e))
  );

  // Keep group open when navigating to a child
  useEffect(() => {
    navEntries.forEach((e) => {
      if (isGroup(e) && isChildActive(e)) setTrackingOpen(true);
    });
  }, [location.pathname]);

  useEffect(() => {
    const handler = () => setMobileOpen((v) => !v);
    window.addEventListener("toggle-admin-sidebar", handler);
    return () => window.removeEventListener("toggle-admin-sidebar", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const renderNavLink = (item: NavItem, showLabel: boolean) => {
    const isActive = location.pathname === item.path;
    const badgeCount = item.badge ? pendingReviewCount : 0;
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
        <div className="relative shrink-0">
          <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
          {!showLabel && (
            <span className="absolute -top-1.5 -right-1.5">
              <AnimatedBadge count={badgeCount} size="sm" />
            </span>
          )}
        </div>
        {showLabel && (
          <span className="flex-1 flex items-center justify-between">
            {t(item.key)}
            {badgeCount > 0 && (
              <span className="ml-auto h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {badgeCount}
              </span>
            )}
          </span>
        )}
      </NavLink>
    );
  };

  const renderGroup = (group: NavGroup, showLabel: boolean) => {
    const groupActive = isChildActive(group);
    const totalBadge = group.children.reduce((sum, c) => sum + (c.badge ? pendingReviewCount : 0), 0);

    // Collapsed mode: show children directly as icon-only links
    if (!showLabel) {
      return (
        <div key={group.groupKey} className="space-y-1">
          {group.children.map((child) => renderNavLink(child, false))}
        </div>
      );
    }

    return (
      <div key={group.groupKey} className="space-y-0.5">
        <button
          onClick={() => setTrackingOpen((v) => !v)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full ${
            groupActive && !trackingOpen
              ? "bg-sidebar-accent text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          }`}
        >
          <group.icon className={`h-5 w-5 shrink-0 ${groupActive ? "text-primary" : ""}`} />
          <span className="flex-1 flex items-center justify-between">
            {t(group.groupKey)}
            <span className="flex items-center gap-1">
              {totalBadge > 0 && !trackingOpen && (
                <span className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {totalBadge}
                </span>
              )}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${trackingOpen ? "rotate-180" : ""}`} />
            </span>
          </span>
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${trackingOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="pl-4 space-y-0.5 pt-0.5">
            {group.children.map((child) => renderNavLink(child, true))}
          </div>
        </div>
      </div>
    );
  };

  const renderNavItems = (showLabel: boolean) =>
    navEntries.map((entry) =>
      isGroup(entry) ? renderGroup(entry, showLabel) : renderNavLink(entry, showLabel)
    );

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
