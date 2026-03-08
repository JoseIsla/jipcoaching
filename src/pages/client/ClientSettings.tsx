import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ClientLayout from "@/components/client/ClientLayout";
import { useClientProfile } from "@/contexts/ClientProfileContext";
import { useClient } from "@/contexts/ClientContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mail, Lock, User, Eye, EyeOff, Globe, Trash2, Volume2, Vibrate, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";
import { useClientPreferencesStore } from "@/data/useClientPreferencesStore";

const ClientSettings = () => {
  const { profile, loading, saving, saveProfile, handleUploadAvatar, handleDeleteAvatar, handleChangeEmail, handleChangePassword } = useClientProfile();
  const { toast } = useToast();
  const { t } = useTranslation();
  const setAppLanguage = useLanguageStore((s) => s.setLanguage);
  const appLanguage = useLanguageStore((s) => s.language);
  const notifSound = useClientPreferencesStore((s) => s.notificationSound);
  const notifVibration = useClientPreferencesStore((s) => s.notificationVibration);
  const setNotifSound = useClientPreferencesStore((s) => s.setNotificationSound);
  const setNotifVibration = useClientPreferencesStore((s) => s.setNotificationVibration);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  // Email change
  const [emailChange, setEmailChange] = useState({ newEmail: "", password: "" });

  // Password change
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Sync from profile
  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setIsDirty(false);
    }
  }, [profile]);

  // Track dirty
  useEffect(() => {
    if (!profile) return;
    setIsDirty(name !== profile.name || phone !== profile.phone);
  }, [name, phone, profile]);

  const initials = (profile?.name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await handleUploadAvatar(file);
    if (res.success) {
      toast({ title: t("clientSettings.profilePicture"), description: t("clientSettings.profileUpdatedDesc") });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    const res = await handleDeleteAvatar();
    if (res.success) {
      toast({ title: t("clientSettings.profilePicture"), description: t("clientSettings.profileUpdatedDesc") });
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast({ title: "Error", description: "El nombre no puede estar vacío.", variant: "destructive" });
      return;
    }
    const res = await saveProfile({ name: name.trim(), phone });
    if (res.success) {
      toast({ title: t("clientSettings.profileUpdated"), description: t("clientSettings.profileUpdatedDesc") });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  const onChangeEmail = async () => {
    if (!emailChange.newEmail || !emailChange.password) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChange.newEmail)) {
      toast({ title: t("clientSettings.invalidEmail"), description: t("clientSettings.invalidEmailDesc"), variant: "destructive" });
      return;
    }
    const res = await handleChangeEmail({
      newEmail: emailChange.newEmail,
      currentPassword: emailChange.password,
    });
    if (res.success) {
      toast({
        title: t("clientSettings.verificationSentTitle"),
        description: t("clientSettings.verificationSentDesc", { email: emailChange.newEmail }),
      });
      setEmailChange({ newEmail: "", password: "" });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  const onChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 6) {
      toast({ title: t("clientSettings.passwordTooShort"), description: t("clientSettings.passwordTooShortDesc"), variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: t("clientSettings.passwordMismatch"), description: t("clientSettings.passwordMismatchDesc"), variant: "destructive" });
      return;
    }
    const res = await handleChangePassword({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
    if (res.success) {
      toast({ title: t("clientSettings.passwordUpdated"), description: t("clientSettings.passwordUpdatedDesc") });
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="space-y-6 max-w-lg mx-auto pb-8">
          <Skeleton className="h-8 w-48" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout>
      <motion.div className="space-y-6 max-w-lg mx-auto pb-8" variants={stagger} initial="initial" animate="animate">
        <motion.div variants={fadeUp}>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            {t("clientSettings.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("clientSettings.subtitle")}</p>
        </motion.div>

        {/* Avatar & Profile */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">{t("clientSettings.profilePicture")}</h2>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{profile?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                  Cambiar
                </Button>
                {profile?.avatarUrl && (
                  <Button variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={saving} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                  </Button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.fullName")}</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.phone")}</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full glow-primary-sm" disabled={!isDirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("clientSettings.saveChanges")}
            </Button>
          </div>
        </motion.div>

        {/* Change Email */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            {t("clientSettings.changeEmail")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("clientSettings.changeEmailDesc")}
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Email actual:</span>
            <span className="text-foreground font-medium">{profile?.email}</span>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.newEmail")}</Label>
              <Input
                type="email"
                value={emailChange.newEmail}
                onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })}
                placeholder="nuevo@email.com"
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
              <Input
                type="password"
                value={emailChange.password}
                onChange={(e) => setEmailChange({ ...emailChange, password: e.target.value })}
                placeholder="••••••••"
                className="bg-background border-border h-10"
              />
            </div>
          </div>
          <Button onClick={onChangeEmail} variant="outline" className="w-full border-border" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
            {t("clientSettings.sendVerification")}
          </Button>
        </motion.div>

        {/* Change Password */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            {t("clientSettings.changePassword")}
          </h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.currentPassword")}</Label>
              <div className="relative">
                <Input
                  type={showCurrentPw ? "text" : "password"}
                  value={passwords.current}
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  placeholder="••••••••"
                  className="bg-background border-border h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.newPassword")}</Label>
              <div className="relative">
                <Input
                  type={showNewPw ? "text" : "password"}
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  placeholder="••••••••"
                  className="bg-background border-border h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("clientSettings.confirmPassword")}</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
                className="bg-background border-border h-10"
              />
            </div>
            <Button onClick={onChangePassword} variant="outline" className="w-full border-border" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {t("clientSettings.changePasswordBtn")}
            </Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-primary" />
            {t("clientSettings.notifications") || "Notificaciones"}
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm text-foreground">{t("clientSettings.notifSound") || "Sonido"}</Label>
              </div>
              <Switch checked={notifSound} onCheckedChange={setNotifSound} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Vibrate className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-sm text-foreground">{t("clientSettings.notifVibration") || "Vibración"}</Label>
              </div>
              <Switch checked={notifVibration} onCheckedChange={setNotifVibration} />
            </div>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div variants={fadeUp} className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            {t("settings.language")}
          </h2>
          <Select value={appLanguage} onValueChange={(val) => setAppLanguage(val as Language)}>
            <SelectTrigger className="bg-background border-border h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">{t("settings.spanish")}</SelectItem>
              <SelectItem value="en">{t("settings.english")}</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
      </motion.div>
    </ClientLayout>
  );
};

export default ClientSettings;
