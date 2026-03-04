import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { useClientStore } from "@/data/useClientStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Mail, Lock, User, Check, Eye, EyeOff, Globe, Trash2, Volume2, Vibrate } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";
import { useClientPreferencesStore } from "@/data/useClientPreferencesStore";

const ClientSettings = () => {
  const { client } = useClient();
  const updateClient = useClientStore((s) => s.updateClient);
  const { toast } = useToast();
  const { t } = useTranslation();
  const setAppLanguage = useLanguageStore((s) => s.setLanguage);
  const appLanguage = useLanguageStore((s) => s.language);
  const notifSound = useClientPreferencesStore((s) => s.notificationSound);
  const notifVibration = useClientPreferencesStore((s) => s.notificationVibration);
  const setNotifSound = useClientPreferencesStore((s) => s.setNotificationSound);
  const setNotifVibration = useClientPreferencesStore((s) => s.setNotificationVibration);

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Profile
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Sync name when client changes
  useEffect(() => {
    setName(client.name);
    setAvatarPreview(client.avatarUrl ?? null);
  }, [client.id, client.name, client.avatarUrl]);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarPreview(dataUrl);
        // Persist avatar to store immediately
        updateClient(client.id, { avatarUrl: dataUrl });
        toast({ title: t("clientSettings.profilePicture"), description: t("clientSettings.profileUpdatedDesc") });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    updateClient(client.id, { avatarUrl: null });
    toast({ title: t("clientSettings.profilePicture"), description: t("clientSettings.profileUpdatedDesc") });
  };

  const handleSaveProfile = () => {
    if (!name.trim()) {
      toast({ title: t("clientSettings.invalidEmail"), description: "El nombre no puede estar vacío.", variant: "destructive" });
      return;
    }
    updateClient(client.id, { name: name.trim() });
    toast({ title: t("clientSettings.profileUpdated"), description: t("clientSettings.profileUpdatedDesc") });
  };

  const handleChangeEmail = () => {
    if (!newEmail.includes("@")) {
      toast({ title: t("clientSettings.invalidEmail"), description: t("clientSettings.invalidEmailDesc"), variant: "destructive" });
      return;
    }
    setEmailSent(true);
    toast({
      title: t("clientSettings.verificationSentTitle"),
      description: t("clientSettings.verificationSentDesc", { email: newEmail }),
    });
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast({ title: t("clientSettings.passwordTooShort"), description: t("clientSettings.passwordTooShortDesc"), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t("clientSettings.passwordMismatch"), description: t("clientSettings.passwordMismatchDesc"), variant: "destructive" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: t("clientSettings.passwordUpdated"), description: t("clientSettings.passwordUpdatedDesc") });
  };

  const stagger = { animate: { transition: { staggerChildren: 0.07 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" as const } },
  };

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
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={avatarPreview || client.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:brightness-110 transition-all"
              >
                <Camera className="h-3.5 w-3.5" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground truncate">{client.email}</p>
              {(avatarPreview || client.avatarUrl) && (
                <button
                  onClick={handleRemoveAvatar}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-destructive hover:underline"
                >
                  <Trash2 className="h-3 w-3" />
                  Eliminar foto
                </button>
              )}
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
            <Button onClick={handleSaveProfile} className="w-full glow-primary-sm">
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
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t("clientSettings.newEmail")}</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => { setNewEmail(e.target.value); setEmailSent(false); }}
              placeholder="nuevo@email.com"
              className="bg-background border-border h-10"
            />
          </div>
          {emailSent ? (
            <div className="flex items-center gap-2 text-xs text-primary">
              <Check className="h-3.5 w-3.5" />
              <span>{t("clientSettings.verificationSent")}</span>
            </div>
          ) : (
            <Button onClick={handleChangeEmail} variant="outline" className="w-full border-border">
              {t("clientSettings.sendVerification")}
            </Button>
          )}
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
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <Button onClick={handleChangePassword} variant="outline" className="w-full border-border">
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