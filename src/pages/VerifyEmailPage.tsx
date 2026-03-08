import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoJip from "@/assets/logo-jip.png";
import { api } from "@/services/api";
import { useTranslation } from "@/i18n/useTranslation";

const VerifyEmailPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [newEmail, setNewEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg(t("verifyEmail.invalidLink"));
      return;
    }

    const verify = async () => {
      try {
        const data = await api.get<{ success: boolean; newEmail: string }>(
          `/verify-email?token=${token}`,
          { skipAuth: true, silent: true }
        );
        if (data?.success) {
          setNewEmail(data.newEmail);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(t("verifyEmail.genericError"));
        }
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err?.body?.message || err?.message || t("verifyEmail.genericError"));
      }
    };

    verify();
  }, [token, t]);

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
          {status === "loading" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
              <h1 className="text-xl font-bold text-foreground">{t("verifyEmail.verifying")}</h1>
              <p className="text-sm text-muted-foreground">{t("verifyEmail.pleaseWait")}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h1 className="text-xl font-bold text-foreground">{t("verifyEmail.successTitle")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("verifyEmail.successDesc", { email: newEmail })}
              </p>
              <Link to="/login">
                <Button className="w-full mt-2 bg-primary text-primary-foreground font-semibold">
                  {t("verifyEmail.loginBtn")}
                </Button>
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-bold text-foreground">{t("verifyEmail.errorTitle")}</h1>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Link to="/login">
                <Button className="w-full mt-2">{t("verifyEmail.loginBtn")}</Button>
              </Link>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 JIP Performance Nutrition. {t("common.allRightsReserved")}
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
