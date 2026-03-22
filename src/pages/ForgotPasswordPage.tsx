import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
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
      setError(err?.message || t("forgotPassword.errorGeneric"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 lg:px-6 lg:py-10 2xl:py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[30rem] animate-fade-in xl:max-w-[32rem]">
        <div className="flex flex-col justify-center gap-6 lg:gap-7 2xl:gap-8">
          <div className="flex justify-center">
            <img src={logoJip} alt="JIP Performance Nutrition" className="h-20 w-auto lg:h-[5.5rem]" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-4 sm:p-8 lg:space-y-5 lg:p-9 xl:rounded-[1.75rem]">
            {sent ? (
              <div className="space-y-4 text-center lg:space-y-5">
                <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
                <div className="space-y-2">
                  <h1 className="text-xl font-bold tracking-tight text-foreground xl:text-[1.8rem]">{t("forgotPassword.successTitle")}</h1>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground xl:text-[0.98rem]">{t("forgotPassword.successDesc")}</p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="mt-1 h-12 w-full font-medium xl:h-[3.25rem] xl:text-[1.02rem]">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t("forgotPassword.backToLogin")}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-bold tracking-tight text-foreground xl:text-[2rem]">{t("forgotPassword.title")}</h1>
                  <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground xl:text-[0.98rem]">{t("forgotPassword.subtitle")}</p>
                </div>

                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive/90">
                    <div className="flex items-start gap-2.5 text-left">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="font-medium text-foreground">{t("forgotPassword.errorGeneric")}</p>
                        <p className="leading-relaxed text-destructive/90">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-4.5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm text-muted-foreground xl:text-[0.95rem]">{t("forgotPassword.emailLabel")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("forgotPassword.emailPlaceholder")}
                        className="h-12 border-border bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 xl:h-[3.25rem] xl:text-[0.95rem]"
                        {...register("email", {
                          required: t("forgotPassword.emailRequired"),
                          pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("forgotPassword.emailInvalid") },
                        })}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs leading-relaxed text-destructive/85">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{errors.email.message}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-all hover:brightness-110 glow-primary-sm hover:glow-primary xl:h-[3.25rem] xl:text-[1.02rem]"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("forgotPassword.submitBtn")}
                  </Button>
                </form>

                <div className="pt-0.5 text-center">
                  <Link to="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground xl:text-[0.95rem]">
                    <ArrowLeft className="mr-1 inline h-3 w-3" />
                    {t("forgotPassword.backToLogin")}
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            © 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
