import { useEffect, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/contexts/AuthContext";
import { type UserRole } from "@/services/authApi";

const getPanelPath = (role: UserRole) => (role === "admin" ? "/admin" : "/client");

const TransitionRedirect = ({ to }: { to: string }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      navigate(to, { replace: true });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, to]);

  return <LoadingScreen message="Cargando panel..." />;
};

export const AuthHomeRedirect = () => {
  const { status, role } = useAuth();

  if (status === "checking") {
    return <LoadingScreen message="Cargando panel..." />;
  }

  if (status === "authenticated" && role) {
    return <TransitionRedirect to={getPanelPath(role)} />;
  }

  return <Navigate to="/login" replace />;
};

export const PublicRoute = ({ children }: { children: ReactNode }) => {
  const { status, role } = useAuth();

  if (status === "checking") {
    return <LoadingScreen message="Cargando panel..." />;
  }

  if (status === "authenticated" && role) {
    return <TransitionRedirect to={getPanelPath(role)} />;
  }

  return <>{children}</>;
};

export const RoleRoute = ({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: ReactNode;
}) => {
  const { status, role } = useAuth();

  if (status === "checking") {
    return <LoadingScreen message="Cargando panel..." />;
  }

  if (status !== "authenticated" || !role) {
    return <Navigate to="/login" replace />;
  }

  if (role !== allowedRole) {
    return <TransitionRedirect to={getPanelPath(role)} />;
  }

  return <>{children}</>;
};
