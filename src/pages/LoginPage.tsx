import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, Loader2, Globe, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingScreen from "@/components/LoadingScreen";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import logoJip from "@/assets/logo-jip.png";
import logoJipDark from "@/assets/logo-jip-dark.png";
import { useThemeStore } from "@/stores/useThemeStore";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";
import { useToast } from "@/hooks/use-toast";

interface LoginFormData { email: string; password: string; }

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const setCurrentUser = useLanguageStore((s) => s.setCurrentUser);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const language = useLanguageStore((s) => s.language);
  const theme = useThemeStore((s) => s.theme);
  const isLightActive = theme === "light" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches);
  const activeLogo = isLightActive ? logoJipDark : logoJip;

  const [userChangedLang, setUserChangedLang] = useState(false);
  useState(() => {
    // Don't reset language — keep whatever was set from the landing page
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const handleLanguageToggle = (lang: Language) => {
    setUserChangedLang(true);
    setLanguage(lang);
  };

  const persistLanguageForUser = (userKey: string) => {
    if (!userChangedLang) return;
    try { localStorage.setItem(`app-language-${userKey}`, language); } catch {}
  };

  const { toast } = useToast();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    let result;
    try {
      result = await login(data);
    } catch (err: any) {
      setIsLoading(false);
      const isNetwork = err?.message === "Failed to fetch" || err?.name === "TypeError";
      if (isNetwork) {
        toast({ variant: "destructive", title: t("login.networkErrorTitle"), description: t("login.networkErrorDesc") });
      } else {
        setError(err?.message || t("login.error"));
      }
      return;
    }
    if (!result.success || !result.role || !result.userId) {
      setIsLoading(false);
      setError(result.error || t("login.error"));
      return;
    }
    persistLanguageForUser(result.userId);
    setShowLoadingScreen(true);
    const targetPath = result.role === "admin" ? "/admin" : "/client";
    window.setTimeout(() => { navigate(targetPath, { replace: true }); }, 900);
  };

  if (showLoadingScreen) return <LoadingScreen />;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 lg:px-6 lg:py-10 2xl:py-12">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={() => handleLanguageToggle("es")}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${language === "es" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        >
          ES
        </button>
        <button
          onClick={() => handleLanguageToggle("en")}
          className={`text-xs font-medium px-2 py-1 rounded-md transition-colors ${language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
        >
          EN
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[30rem] animate-fade-in xl:max-w-[32rem]">
        <div className="flex flex-col justify-center gap-6 lg:gap-7 2xl:gap-8">
          <div className="flex justify-center">
            <img src={activeLogo} alt="JIP Performance Nutrition" className="h-20 w-auto lg:h-[5.5rem]" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-7 shadow-sm space-y-4 sm:p-8 lg:space-y-5 lg:p-9 xl:rounded-[1.75rem]">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground xl:text-[2rem]">{t("login.welcome")}</h1>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground xl:text-[0.98rem]">{t("login.subtitle")}</p>
          </div>
          {error && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/8 px-3.5 py-2.5 text-sm text-destructive/90">
              <div className="flex items-start gap-2.5 text-left">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">{t("login.error")}</p>
                  <p className="leading-relaxed text-destructive/90">{error}</p>
                </div>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 lg:space-y-4.5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-muted-foreground xl:text-[0.95rem]">{t("login.emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} className="h-12 border-border bg-muted pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 xl:h-[3.25rem] xl:text-[0.95rem]"
                  {...register("email", { required: t("login.emailRequired"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("login.emailInvalid") } })} />
              </div>
              {errors.email && (
                <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs leading-relaxed text-destructive/85">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm xl:text-[0.95rem]">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="h-12 border-border bg-muted pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 xl:h-[3.25rem] xl:text-[0.95rem]"
                  {...register("password", { required: t("login.passwordRequired"), minLength: { value: 6, message: t("login.passwordMinLength") } })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 inline-flex items-start gap-1.5 text-xs leading-relaxed text-destructive/85">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>
            <Button type="submit" disabled={isLoading} className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground transition-all hover:brightness-110 glow-primary-sm hover:glow-primary xl:h-[3.25rem] xl:text-[1.02rem]">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("login.submit")}
            </Button>
          </form>
          <div className="pt-0.5 text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors xl:text-[0.95rem]">
              {t("forgotPassword.linkText")}
            </Link>
          </div>
          </div>

          <div className="space-y-3 pt-0.5 lg:pt-1">
            <p className="text-center text-xs text-muted-foreground">© 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}</p>
            {DEV_MOCK && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">🛠 Modo Desarrollo</p>
                <p><strong>Admin:</strong> admin@jipcoaching.com / admin123</p>
                <p><strong>Cliente:</strong> carlos@email.com / client123</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <PWAInstallBanner />
    </div>
  );
};

export default LoginPage;
