import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { compressImage } from "@/utils/compressMedia";
import { API_BASE_URL } from "@/services/api";
import {
  type ClientProfile,
  fetchClientProfile,
  updateClientProfile,
  uploadClientAvatar,
  deleteClientAvatar,
  changeClientEmail,
  changeClientPassword,
  type UpdateClientProfilePayload,
  type ChangeEmailPayload,
  type ChangePasswordPayload,
  type ApiResponse,
} from "@/services/clientProfileApi";

interface ClientProfileContextValue {
  profile: ClientProfile | null;
  loading: boolean;
  saving: boolean;
  reload: () => Promise<void>;
  saveProfile: (payload: UpdateClientProfilePayload) => Promise<ApiResponse<ClientProfile>>;
  handleUploadAvatar: (file: File) => Promise<ApiResponse<{ avatarUrl: string }>>;
  handleDeleteAvatar: () => Promise<ApiResponse>;
  handleChangeEmail: (payload: ChangeEmailPayload) => Promise<ApiResponse>;
  handleChangePassword: (payload: ChangePasswordPayload) => Promise<ApiResponse>;
}

const ClientProfileContext = createContext<ClientProfileContextValue | null>(null);

export function ClientProfileProvider({ children }: { children: ReactNode }) {
  const { status, role } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const resolveAvatar = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;
    const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
    return `${serverRoot}${url}`;
  };

  const reload = useCallback(async () => {
    setLoading(true);
    const res = await fetchClientProfile();
    if (res.success && res.data) setProfile({ ...res.data, avatarUrl: resolveAvatar(res.data.avatarUrl) });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated" && role === "client") {
      reload();
    } else {
      setLoading(false);
    }
  }, [status, role, reload]);

  // Reload profile when tab regains focus (e.g. after email verification in another tab)
  useEffect(() => {
    if (status !== "authenticated" || role !== "client") return;
    const onVisible = () => {
      if (document.visibilityState === "visible") reload();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [status, role, reload]);

  const saveProfile = useCallback(async (payload: UpdateClientProfilePayload) => {
    setSaving(true);
    const res = await updateClientProfile(payload);
    if (res.success && res.data) setProfile({ ...res.data, avatarUrl: resolveAvatar(res.data.avatarUrl) });
    setSaving(false);
    return res;
  }, []);

  const handleUploadAvatar = useCallback(async (file: File) => {
    setSaving(true);
    const compressed = await compressImage(file, { maxSizeMB: 2, maxWidth: 800, maxHeight: 800 });
    const res = await uploadClientAvatar(compressed);
    if (res.success && res.data) {
      setProfile((prev) => prev ? { ...prev, avatarUrl: resolveAvatar(res.data!.avatarUrl) } : prev);
    }
    setSaving(false);
    return res;
  }, []);

  const handleDeleteAvatar = useCallback(async () => {
    setSaving(true);
    const res = await deleteClientAvatar();
    if (res.success) {
      setProfile((prev) => prev ? { ...prev, avatarUrl: null } : prev);
    }
    setSaving(false);
    return res;
  }, []);

  const handleChangeEmail = useCallback(async (payload: ChangeEmailPayload) => {
    setSaving(true);
    const res = await changeClientEmail(payload);
    setSaving(false);
    return res;
  }, []);

  const handleChangePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setSaving(true);
    const res = await changeClientPassword(payload);
    setSaving(false);
    return res;
  }, []);

  return (
    <ClientProfileContext.Provider
      value={{
        profile,
        loading,
        saving,
        reload,
        saveProfile,
        handleUploadAvatar,
        handleDeleteAvatar,
        handleChangeEmail,
        handleChangePassword,
      }}
    >
      {children}
    </ClientProfileContext.Provider>
  );
}

export function useClientProfile() {
  const ctx = useContext(ClientProfileContext);
  if (!ctx) throw new Error("useClientProfile must be used within ClientProfileProvider");
  return ctx;
}
