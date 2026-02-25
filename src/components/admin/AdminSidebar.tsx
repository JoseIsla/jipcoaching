import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Utensils,
  Dumbbell,
  ClipboardList,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logoJip from "@/assets/logo-jip.png";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Clientes", icon: Users, path: "/admin/clients" },
  { label: "Nutrición", icon: Utensils, path: "/admin/nutrition" },
  { label: "Entrenamiento", icon: Dumbbell, path: "/admin/training" },
  { label: "Cuestionarios", icon: ClipboardList, path: "/admin/questionnaires" },
  { label: "Configuración", icon: Settings, path: "/admin/settings" },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-64"
      } bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b border-sidebar-border px-4">
        {!collapsed ? (
          <img src={logoJip} alt="JIP" className="h-12 w-auto" />
        ) : (
          <span className="text-primary font-black text-xl">J</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map((item) => {
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
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
