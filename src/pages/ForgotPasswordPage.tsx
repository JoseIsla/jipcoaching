import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import logoJip from "@/assets/logo-jip.png";
import { api } from "@/services/api";
import { useTranslation } from "@/i18n/useTranslation";

interface ForgotForm {
  email: string;
}

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>();

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: data.email }, { skipAuth: true, silent: true });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Error al enviar el email.");
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
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">Email enviado</h1>
              <p className="text-sm text-muted-foreground">
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4 w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">¿Olvidaste tu contraseña?</h1>
                <p className="text-sm text-muted-foreground">Introduce tu email y te enviaremos un enlace de recuperación.</p>
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-muted-foreground text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground"
                      {...register("email", {
                        required: "El email es obligatorio",
                        pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email no válido" },
                      })}
                    />
                  </div>
                  {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Enviar enlace de recuperación"}
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

export default ForgotPasswordPage;
