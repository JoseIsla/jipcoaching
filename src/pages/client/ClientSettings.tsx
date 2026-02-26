import { useState } from "react";
import ClientLayout from "@/components/client/ClientLayout";
import { useClient } from "@/contexts/ClientContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Mail, Lock, User, Check, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ClientSettings = () => {
  const { client } = useClient();
  const { toast } = useToast();

  const initials = client.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Profile
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    toast({ title: "Perfil actualizado", description: "Tus datos se han guardado correctamente." });
  };

  const handleChangeEmail = () => {
    if (!newEmail.includes("@")) {
      toast({ title: "Email inválido", description: "Introduce un email válido.", variant: "destructive" });
      return;
    }
    setEmailSent(true);
    toast({
      title: "Verificación enviada",
      description: `Se ha enviado un email de verificación a ${newEmail}. Revisa tu bandeja.`,
    });
  };

  const handleChangePassword = () => {
    if (newPassword.length < 6) {
      toast({ title: "Contraseña muy corta", description: "Mínimo 6 caracteres.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "No coinciden", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast({ title: "Contraseña actualizada", description: "Tu contraseña se ha cambiado correctamente." });
  };

  return (
    <ClientLayout>
      <div className="space-y-6 max-w-lg mx-auto animate-fade-in pb-8">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Configuración
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gestiona tu perfil y seguridad</p>
        </div>

        {/* Avatar & Profile */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage src={avatarPreview || undefined} />
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
            <div>
              <p className="text-sm font-medium text-foreground">{client.name}</p>
              <p className="text-xs text-muted-foreground">{client.email}</p>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nombre completo</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Teléfono</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full glow-primary-sm">
              Guardar cambios
            </Button>
          </div>
        </div>

        {/* Change Email */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            Cambiar email
          </h2>
          <p className="text-xs text-muted-foreground">
            Se enviará un enlace de verificación al nuevo email antes de aplicar el cambio.
          </p>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nuevo email</Label>
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
              <span>Verificación enviada. Revisa tu bandeja de entrada.</span>
            </div>
          ) : (
            <Button onClick={handleChangeEmail} variant="outline" className="w-full border-border">
              Enviar verificación
            </Button>
          )}
        </div>

        {/* Change Password */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Cambiar contraseña
          </h2>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Contraseña actual</Label>
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
              <Label className="text-xs text-muted-foreground">Nueva contraseña</Label>
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
              <Label className="text-xs text-muted-foreground">Confirmar nueva contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-background border-border h-10"
              />
            </div>
            <Button onClick={handleChangePassword} variant="outline" className="w-full border-border">
              Cambiar contraseña
            </Button>
          </div>
        </div>
      </div>
    </ClientLayout>
  );
};

export default ClientSettings;
