import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoJip from "@/assets/logo-jip.png";
import { api } from "@/services/api";
import { useTranslation } from "@/i18n/useTranslation";

interface ResetForm {
  password: string;
  confirmPassword: string;
}

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetForm>();
  const password = watch("password");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center mb-6">
            <img src={logoJip} alt="JIP" className="h-24 w-auto" />
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Enlace inválido</h1>
            <p className="text-sm text-muted-foreground">
              Este enlace de recuperación no es válido. Solicita uno nuevo.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full mt-2">Solicitar nuevo enlace</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    setIsLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, password: data.password }, { skipAuth: true, silent: true });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.body?.message || err?.message || "Error al restablecer la contraseña.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="flex justify-center mb-10">
          <img src={logoJip} alt="JIP Performance Nutrition" className="h-24 w-auto" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">¡Contraseña actualizada!</h1>
              <p className="text-sm text-muted-foreground">
                Tu contraseña ha sido cambiada correctamente. Ya puedes iniciar sesión.
              </p>
              <Link to="/login">
                <Button className="w-full mt-2 bg-primary text-primary-foreground font-semibold">
                  Iniciar sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Nueva contraseña</h1>
                <p className="text-sm text-muted-foreground">Introduce tu nueva contraseña para continuar.</p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground text-sm">Nueva contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground"
                      {...register("password", {
                        required: "La contraseña es obligatoria",
                        minLength: { value: 6, message: "Mínimo 6 caracteres" },
                      })}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground text-sm">Confirmar contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground"
                      {...register("confirmPassword", {
                        required: "Confirma la contraseña",
                        validate: (v) => v === password || "Las contraseñas no coinciden",
                      })}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-destructive text-xs mt-1">{errors.confirmPassword.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Restablecer contraseña"}
                </Button>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3 w-3 inline mr-1" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
