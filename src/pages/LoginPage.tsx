import { useState } from "react";
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

const LoginPage = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
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

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="flex justify-center mb-10">
          <img src={logoJip} alt="JIP Performance Nutrition" className="h-24 w-auto" />
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("login.welcome")}</h1>
            <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>
          {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg p-3 text-center">{error}</div>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-sm">{t("login.emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder={t("login.emailPlaceholder")} className="pl-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground"
                  {...register("email", { required: t("login.emailRequired"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("login.emailInvalid") } })} />
              </div>
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-sm">{t("login.passwordLabel")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 bg-muted border-border focus:border-primary focus:ring-primary/20 h-12 text-foreground placeholder:text-muted-foreground"
                  {...register("password", { required: t("login.passwordRequired"), minLength: { value: 6, message: t("login.passwordMinLength") } })} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base hover:brightness-110 transition-all glow-primary-sm hover:glow-primary">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("login.submit")}
            </Button>
          </form>
          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              {t("forgotPassword.linkText")}
            </Link>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">© 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}</p>
        {DEV_MOCK ? (
          <div className="mt-4 bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">🛠 Modo Desarrollo</p>
            <p><strong>Admin:</strong> admin@jipcoaching.com / admin123</p>
            <p><strong>Cliente:</strong> carlos@email.com / client123</p>
          </div>
        ) : (
          <p className="text-center text-[10px] text-muted-foreground/50 mt-2 font-mono truncate px-4" title={API_BASE_URL}>
            API: {API_BASE_URL}
          </p>
        )}
      </div>
      <PWAInstallBanner />
    </div>
  );
};

export default LoginPage;
