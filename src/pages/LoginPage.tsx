import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import LoadingScreen from "@/components/LoadingScreen";
import logoJip from "@/assets/logo-jip.png";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/useTranslation";

interface LoginFormData { email: string; password: string; }

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");
    const result = await login(data);
    if (!result.success || !result.role) {
      setIsLoading(false);
      setError(result.error || t("login.error"));
      return;
    }
    setShowLoadingScreen(true);
    const targetPath = result.role === "admin" ? "/admin" : "/client";
    window.setTimeout(() => { navigate(targetPath, { replace: true }); }, 900);
  };

  const handleMockLogin = (role: "admin" | "client") => {
    setShowLoadingScreen(true);
    localStorage.setItem("jip_auth_token", `mock_token_${role}`);
    localStorage.setItem("jip_mock_role", role);
    window.setTimeout(() => { window.location.href = role === "admin" ? "/admin" : "/client"; }, 900);
  };

  if (showLoadingScreen) return <LoadingScreen />;

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
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("login.welcome")}</h1>
            <p className="text-sm text-muted-foreground">{t("login.quickAccess")}</p>
          </div>
          <div className="space-y-3">
            <Label className="text-muted-foreground text-sm">{t("login.accessAs")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" onClick={() => handleMockLogin("admin")} className="h-12 bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-all">{t("login.admin")}</Button>
              <Button type="button" onClick={() => handleMockLogin("client")} variant="outline" className="h-12 border-primary text-primary font-semibold hover:bg-primary/10 transition-all">{t("login.client")}</Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">{t("login.orCredentials")}</span>
            <div className="h-px flex-1 bg-border" />
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
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8">© 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}</p>
      </div>
    </div>
  );
};

export default LoginPage;
