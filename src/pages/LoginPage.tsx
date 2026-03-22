import { forwardRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, Loader2, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingScreen from "@/components/LoadingScreen";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import logoJip from "@/assets/logo-jip.png";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/services/api";
import { DEV_MOCK } from "@/config/devMode";
import { useTranslation } from "@/i18n/useTranslation";
import { useLanguageStore, type Language } from "@/i18n/store";
import { useToast } from "@/hooks/use-toast";

interface LoginFormData { email: string; password: string; }

const LoginPage = forwardRef<HTMLDivElement>((_, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const setCurrentUser = useLanguageStore((s) => s.setCurrentUser);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const language = useLanguageStore((s) => s.language);

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
    <div ref={ref} className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8 lg:px-6 lg:py-12 2xl:py-16">
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

      <div className="relative z-10 w-full max-w-md animate-fade-in lg:max-w-lg 2xl:max-w-xl">
        <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center gap-8 lg:min-h-[calc(100vh-6rem)] lg:gap-10 2xl:min-h-[calc(100vh-8rem)] 2xl:gap-12">
          <div className="flex justify-center">
            <img src={logoJip} alt="JIP Performance Nutrition" className="h-20 w-auto lg:h-24 2xl:h-28" />
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 lg:p-9 2xl:rounded-3xl 2xl:p-11 2xl:space-y-7">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground xl:text-[1.85rem] 2xl:text-[2.15rem]">{t("login.welcome")}</h1>
            <p className="text-sm text-muted-foreground xl:text-[0.95rem] 2xl:text-base 2xl:max-w-md 2xl:mx-auto">{t("login.subtitle")}</p>
          </div>
          {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 text-center">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 2xl:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-sm xl:text-[0.95rem]">{t("login.emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} className="pl-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground xl:h-13 xl:text-[0.95rem] 2xl:h-14 2xl:text-base"
                  {...register("email", { required: t("login.emailRequired"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("login.emailInvalid") } })} />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm xl:text-[0.95rem]">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground xl:h-13 xl:text-[0.95rem] 2xl:h-14 2xl:text-base"
                  {...register("password", { required: t("login.passwordRequired"), minLength: { value: 6, message: t("login.passwordMinLength") } })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all glow-primary-sm hover:glow-primary xl:h-13 xl:text-[1.02rem] 2xl:h-14 2xl:text-lg">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("login.submit")}
            </Button>
          </form>
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors xl:text-[0.95rem]">
              {t("forgotPassword.linkText")}
            </Link>
          </div>
          </div>

          <div className="space-y-4 pt-1 lg:pt-2">
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
});

LoginPage.displayName = "LoginPage";

export default LoginPage;
