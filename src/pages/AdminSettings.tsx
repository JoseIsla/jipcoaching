import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Save, Shield, Bell, Globe, User, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";

const TIMEZONES = [
  "Europe/Madrid",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Lisbon",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Bogota",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const AdminSettings = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const setAppLanguage = useLanguageStore((s) => s.setLanguage);
  const appLanguage = useLanguageStore((s) => s.language);

  const {
    profile,
    loading,
    saving,
    saveProfile,
    handleUploadAvatar,
    handleDeleteAvatar,
    handleChangeEmail,
    handleChangePassword,
  } = useAdminProfile();

  const { logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("");
  const [language, setLanguage] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    newClient: true,
    paymentReminder: true,
  });

  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [emailChange, setEmailChange] = useState({ newEmail: "", password: "" });
  const [isDirty, setIsDirty] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone);
      setTimezone(profile.timezone);
      setLanguage(profile.language);
      setNotifications({ ...profile.notifications });
      setIsDirty(false);
    }
  }, [profile]);

  // Track dirty state (only for name/phone, not notifications which auto-save)
  useEffect(() => {
    if (!profile) return;
    const dirty =
      name !== profile.name ||
      phone !== profile.phone;
    setIsDirty(dirty);
  }, [name, phone, profile]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleSaveProfile = async () => {
    const res = await saveProfile({ name, phone, timezone, language, notifications });
    if (res.success) {
      toast({ title: t("settings.profileUpdated"), description: t("settings.profileUpdatedDesc") });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  // Auto-save notification toggle
  const handleNotificationToggle = async (key: keyof typeof notifications, checked: boolean) => {
    const updated = { ...notifications, [key]: checked };
    setNotifications(updated);
    const res = await saveProfile({ name, phone, timezone, language, notifications: updated });
    if (res.success) {
      toast({ title: t("settings.notificationSaved"), description: t("settings.notificationSavedDesc") });
    }
  };

  // Timezone change — auto-save
  const handleTimezoneChange = async (tz: string) => {
    setTimezone(tz);
    await saveProfile({ name, phone, timezone: tz, language, notifications });
    toast({ title: t("settings.profileUpdated"), description: t("settings.profileUpdatedDesc") });
  };

  // Language change — update i18n store + save profile
  const handleLanguageChange = async (lang: string) => {
    const appLang = lang as Language;
    setLanguage(lang);
    setAppLanguage(appLang);
    await saveProfile({ name, phone, timezone, language: lang, notifications });
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await handleUploadAvatar(file);
    if (res.success) {
      toast({ title: t("settings.avatarUpdated"), description: t("settings.avatarUpdatedDesc") });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    const res = await handleDeleteAvatar();
    if (res.success) {
      toast({ title: t("settings.avatarDeleted"), description: t("settings.avatarDeletedDesc") });
    }
  };

  const onChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: t("settings.fillAllPassword"), variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: t("settings.passwordMismatch"), variant: "destructive" });
      return;
    }
    if (passwords.new.length < 8) {
      toast({ title: "Error", description: t("settings.passwordTooShort"), variant: "destructive" });
      return;
    }
    const res = await handleChangePassword({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
    if (res.success) {
      toast({ title: t("settings.passwordUpdated"), description: "Sesión cerrada. Inicia sesión con tu nueva contraseña." });
      setPasswords({ current: "", new: "", confirm: "" });
      setTimeout(async () => {
        await logout();
        navigate("/login");
      }, 1200);
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  const onChangeEmail = async () => {
    if (!emailChange.newEmail || !emailChange.password) {
      toast({ title: "Error", description: t("settings.fillAllFields"), variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChange.newEmail)) {
      toast({ title: "Error", description: t("settings.invalidEmail"), variant: "destructive" });
      return;
    }
    const res = await handleChangeEmail({
      newEmail: emailChange.newEmail,
      currentPassword: emailChange.password,
    });
    if (res.success) {
      toast({
        title: t("settings.verificationSent"),
        description: t("settings.verificationSentDesc", { email: emailChange.newEmail }),
      });
      setEmailChange({ newEmail: "", password: "" });
    } else {
      toast({ title: "Error", description: res.error || "", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8 max-w-4xl animate-fade-in">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminLayout>
    );
  }

  const notificationItems = [
    { key: "email" as const, label: t("settings.emailNotifications"), desc: t("settings.emailNotificationsDesc") },
    { key: "push" as const, label: t("settings.pushNotifications"), desc: t("settings.pushNotificationsDesc") },
    { key: "newClient" as const, label: t("settings.newClient"), desc: t("settings.newClientDesc") },
    { key: "paymentReminder" as const, label: t("settings.paymentReminder"), desc: t("settings.paymentReminderDesc") },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("settings.subtitle")}</p>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t("settings.profile")}</CardTitle>
              <CardDescription>{t("settings.profileDesc")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
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
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{t("settings.profilePicture")}</p>
                <p className="text-xs text-muted-foreground">{t("settings.photoFormats")}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                    {t("settings.changePhoto")}
                  </Button>
                  {profile?.avatarUrl && (
                    <Button variant="outline" size="sm" onClick={handleRemoveAvatar} disabled={saving} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-1" /> {t("settings.deletePhoto")}
                    </Button>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarSelect} />
              </div>
            </div>

            <Separator className="bg-border" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.fullName")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.phone")}</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-muted border-border text-foreground" />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {isDirty && <p className="text-xs text-accent">{t("settings.unsavedChanges")}</p>}
              <div className="ml-auto">
                <Button onClick={handleSaveProfile} disabled={!isDirty || saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change Email */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t("settings.emailTitle")}</CardTitle>
              <CardDescription>{t("settings.emailDesc")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("settings.currentEmail")}</span>
              <span className="text-foreground font-medium">{profile?.email}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.newEmail")}</Label>
                <Input type="email" placeholder={t("settings.newEmailPlaceholder")} value={emailChange.newEmail} onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })} className="bg-muted border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.currentPasswordLabel")}</Label>
                <Input type="password" placeholder="••••••••" value={emailChange.password} onChange={(e) => setEmailChange({ ...emailChange, password: e.target.value })} className="bg-muted border-border text-foreground" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onChangeEmail} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {t("settings.sendVerification")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t("settings.passwordTitle")}</CardTitle>
              <CardDescription>{t("settings.passwordDesc")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">{t("settings.currentPassword")}</Label>
              <Input type="password" placeholder="••••••••" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="bg-muted border-border text-foreground" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.newPassword")}</Label>
                <Input type="password" placeholder={t("settings.newPasswordPlaceholder")} value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="bg-muted border-border text-foreground" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.confirmPassword")}</Label>
                <Input type="password" placeholder="••••••••" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="bg-muted border-border text-foreground" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onChangePassword} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                {t("settings.changePassword")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications — auto-save */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t("settings.notificationsTitle")}</CardTitle>
              <CardDescription>{t("settings.notificationsDesc")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) => handleNotificationToggle(item.key, checked)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">{t("settings.preferencesTitle")}</CardTitle>
              <CardDescription>{t("settings.preferencesDesc")}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.timezone")}</Label>
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t("settings.language")}</Label>
                <Select value={appLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="es">{t("settings.spanish")}</SelectItem>
                    <SelectItem value="en">{t("settings.english")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
