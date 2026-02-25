import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminProfile } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Camera, Save, Shield, Bell, Globe, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const { toast } = useToast();
  const [profile, setProfile] = useState({ ...adminProfile });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [emailChange, setEmailChange] = useState({ newEmail: "", password: "" });

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const handleSaveProfile = () => {
    toast({ title: "Perfil actualizado", description: "Los cambios se han guardado correctamente." });
  };

  const handleChangePassword = () => {
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
    toast({ title: "Contraseña actualizada", description: "Tu contraseña se ha cambiado correctamente." });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  const handleChangeEmail = () => {
    if (!emailChange.newEmail || !emailChange.password) {
      toast({ title: "Error", description: "Completa todos los campos.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChange.newEmail)) {
      toast({ title: "Error", description: "Introduce un correo válido.", variant: "destructive" });
      return;
    }
    toast({ title: "Verificación enviada", description: `Se ha enviado un enlace de verificación a ${emailChange.newEmail}.` });
    setEmailChange({ newEmail: "", password: "" });
  };

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
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-foreground" />
                </button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Foto de perfil</p>
                <p className="text-xs text-muted-foreground">JPG, PNG. Máx 2MB.</p>
                <Button variant="outline" size="sm" className="mt-2">
                  <Camera className="h-4 w-4 mr-1" /> Cambiar foto
                </Button>
              </div>
            </div>

            <Separator className="bg-border" />

            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground">Nombre completo</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Teléfono</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveProfile}>
                <Save className="h-4 w-4 mr-1" /> Guardar cambios
              </Button>
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
              <span className="text-foreground font-medium">{profile.email}</span>
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
              <Button variant="outline" onClick={handleChangeEmail}>
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
              <Button variant="outline" onClick={handleChangePassword}>
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
            {[
              { key: "email" as const, label: "Notificaciones por email", desc: "Recibe resúmenes y alertas en tu correo" },
              { key: "push" as const, label: "Notificaciones push", desc: "Alertas en tiempo real en el navegador" },
              { key: "newClient" as const, label: "Nuevo cliente", desc: "Aviso cuando un cliente se registra" },
              { key: "paymentReminder" as const, label: "Recordatorio de pago", desc: "Alerta cuando un pago está próximo" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={profile.notifications[item.key]}
                  onCheckedChange={(checked) =>
                    setProfile({
                      ...profile,
                      notifications: { ...profile.notifications, [item.key]: checked },
                    })
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
                  value={profile.timezone}
                  onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Idioma</Label>
                <Input
                  value={profile.language}
                  onChange={(e) => setProfile({ ...profile, language: e.target.value })}
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
