import { useState, useRef, useEffect } from "react";
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
import { Camera, Save, Shield, Bell, Globe, User, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
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

  // Local form state (initialized from profile context)
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

  // Sync local state when profile loads/changes
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

  // Track dirty state
  useEffect(() => {
    if (!profile) return;
    const dirty =
      name !== profile.name ||
      phone !== profile.phone ||
      timezone !== profile.timezone ||
      language !== profile.language ||
      notifications.email !== profile.notifications.email ||
      notifications.push !== profile.notifications.push ||
      notifications.newClient !== profile.notifications.newClient ||
      notifications.paymentReminder !== profile.notifications.paymentReminder;
    setIsDirty(dirty);
  }, [name, phone, timezone, language, notifications, profile]);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleSaveProfile = async () => {
    const res = await saveProfile({ name, phone, timezone, language, notifications });
    if (res.success) {
      toast({ title: "Perfil actualizado", description: "Los cambios se han guardado en la base de datos." });
    } else {
      toast({ title: "Error", description: res.error || "No se pudo guardar.", variant: "destructive" });
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await handleUploadAvatar(file);
    if (res.success) {
      toast({ title: "Avatar actualizado", description: "La foto anterior ha sido reemplazada." });
    } else {
      toast({ title: "Error", description: res.error || "No se pudo subir la imagen.", variant: "destructive" });
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveAvatar = async () => {
    const res = await handleDeleteAvatar();
    if (res.success) {
      toast({ title: "Avatar eliminado", description: "Se ha eliminado tu foto de perfil." });
    }
  };

  const onChangePassword = async () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast({ title: "Error", description: "Completa todos los campos de contraseña.", variant: "destructive" });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (passwords.new.length < 8) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 8 caracteres.", variant: "destructive" });
      return;
    }
    const res = await handleChangePassword({
      currentPassword: passwords.current,
      newPassword: passwords.new,
    });
    if (res.success) {
      toast({ title: "Contraseña actualizada", description: "Tu contraseña se ha actualizado en la base de datos." });
      setPasswords({ current: "", new: "", confirm: "" });
    } else {
      toast({ title: "Error", description: res.error || "No se pudo cambiar la contraseña.", variant: "destructive" });
    }
  };

  const onChangeEmail = async () => {
    if (!emailChange.newEmail || !emailChange.password) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChange.newEmail)) {
      toast({ title: "Error", description: "Introduce un correo válido.", variant: "destructive" });
      return;
    }
    const res = await handleChangeEmail({
      newEmail: emailChange.newEmail,
      currentPassword: emailChange.password,
    });
    if (res.success) {
      toast({
        title: "Verificación enviada",
        description: `Se ha enviado un enlace de verificación a ${emailChange.newEmail}. El email se actualizará en la base de datos tras la verificación.`,
      });
      setEmailChange({ newEmail: "", password: "" });
    } else {
      toast({ title: "Error", description: res.error || "No se pudo procesar.", variant: "destructive" });
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

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tu perfil y preferencias</p>
        </div>

        {/* Profile Info */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Perfil</CardTitle>
              <CardDescription>Tu información personal y avatar</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
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
                <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">JPG, PNG o WebP. Máx 2MB.</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Camera className="h-4 w-4 mr-1" />}
                    Cambiar foto
                  </Button>
                  {profile?.avatarUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveAvatar}
                      disabled={saving}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nombre completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Teléfono</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              {isDirty && (
                <p className="text-xs text-accent">Tienes cambios sin guardar</p>
              )}
              <div className="ml-auto">
                <Button onClick={handleSaveProfile} disabled={!isDirty || saving}>
                  {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                  Guardar cambios
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
              <CardTitle className="text-lg">Correo electrónico</CardTitle>
              <CardDescription>Cambia tu email con verificación</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Email actual:</span>
              <span className="text-foreground font-medium">{profile?.email}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nuevo correo</Label>
                <Input
                  type="email"
                  placeholder="nuevo@email.com"
                  value={emailChange.newEmail}
                  onChange={(e) => setEmailChange({ ...emailChange, newEmail: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Contraseña actual</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={emailChange.password}
                  onChange={(e) => setEmailChange({ ...emailChange, password: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onChangeEmail} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Enviar verificación
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Contraseña actual</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="bg-muted border-border text-foreground"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nueva contraseña</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={passwords.new}
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Confirmar contraseña</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={onChangePassword} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                Cambiar contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              <CardDescription>Configura cómo recibes alertas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {([
              { key: "email" as const, label: "Notificaciones por email", desc: "Recibe resúmenes y alertas en tu correo" },
              { key: "push" as const, label: "Notificaciones push", desc: "Alertas en tiempo real en el navegador" },
              { key: "newClient" as const, label: "Nuevo cliente", desc: "Aviso cuando un cliente se registra" },
              { key: "paymentReminder" as const, label: "Recordatorio de pago", desc: "Alerta cuando un pago está próximo" },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                  }
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
              <CardTitle className="text-lg">Preferencias</CardTitle>
              <CardDescription>Zona horaria e idioma</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Zona horaria</Label>
                <Input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Idioma</Label>
                <Input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
