import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Film, Loader2, PlayCircle, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface JobStatus {
  running: boolean;
  startedAt: string | null;
  finishedAt: string | null;
  exitCode: number | null;
  summary: string | null;
  failures?: string[];
  logTail: string[];
  logLines: number;
}

const TranscodeLegacyCard = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [dryRun, setDryRun] = useState(false);
  const [force, setForce] = useState(false);
  const pollRef = useRef<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const fetchStatus = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.get<JobStatus>("/admin/transcode-legacy/status", { silent: true });
      setStatus(data);
    } catch {
      // ignore — endpoint might not exist yet on the deployed server
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // initial fetch
  useEffect(() => {
    void fetchStatus();
  }, []);

  // polling while running
  useEffect(() => {
    if (status?.running) {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(() => fetchStatus(true), 2500);
      return () => {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [status?.running]);

  // auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ block: "end" });
  }, [status?.logTail?.length]);

  const handleStart = async () => {
    try {
      setLaunching(true);
      const params = new URLSearchParams();
      if (dryRun) params.set("dryRun", "1");
      if (force) params.set("force", "1");
      const qs = params.toString();
      await api.post(`/admin/transcode-legacy${qs ? `?${qs}` : ""}`, undefined, { silent: true });
      toast({
        title: "Migración iniciada",
        description: dryRun
          ? "Ejecutando en modo simulación (sin cambios)."
          : "Convirtiendo vídeos antiguos a H.264/MP4 en segundo plano.",
      });
      await fetchStatus(true);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar",
        description: err?.message ?? "Error desconocido",
      });
    } finally {
      setLaunching(false);
    }
  };

  const lastRunLabel = status?.finishedAt
    ? new Date(status.finishedAt).toLocaleString("es-ES")
    : status?.startedAt
    ? new Date(status.startedAt).toLocaleString("es-ES")
    : null;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center gap-2">
        <Film className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <CardTitle className="text-lg">Migración de vídeos antiguos</CardTitle>
          <CardDescription>
            Convierte los vídeos previos a H.264/MP4 para que se vean en todos los navegadores y dispositivos.
            Es seguro relanzarlo: salta los que ya están en el formato correcto.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label htmlFor="dry-run" className="text-sm font-medium text-foreground">
                Modo simulación
              </Label>
              <p className="text-xs text-muted-foreground">Solo lista lo que haría, sin tocar archivos.</p>
            </div>
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
              disabled={status?.running || launching}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div>
              <Label htmlFor="force" className="text-sm font-medium text-foreground">
                Forzar re-codificación
              </Label>
              <p className="text-xs text-muted-foreground">Re-encoda incluso los ya en H.264 (lento).</p>
            </div>
            <Switch
              id="force"
              checked={force}
              onCheckedChange={setForce}
              disabled={status?.running || launching}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleStart}
            disabled={status?.running || launching}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {status?.running || launching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status?.running ? "Migrando…" : "Iniciando…"}
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                Iniciar migración
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => fetchStatus()}
            disabled={loading}
            className="border-border"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar estado
          </Button>
          {lastRunLabel && (
            <span className="text-xs text-muted-foreground">
              {status?.running ? "Iniciado" : "Última ejecución"}: {lastRunLabel}
              {status?.exitCode !== null && status.exitCode !== undefined && !status.running && (
                <>
                  {" · "}
                  <span className={status.exitCode === 0 ? "text-primary" : "text-destructive"}>
                    {status.exitCode === 0 ? "Completada" : `Error (code ${status.exitCode})`}
                  </span>
                </>
              )}
            </span>
          )}
        </div>

        {status?.summary && !status.running && (
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium text-foreground mb-1">Resumen de la última ejecución</p>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{status.summary}</pre>
          </div>
        )}

        {status?.logTail && status.logTail.length > 0 && (
          <div className="rounded-lg border border-border bg-background/50 p-3 max-h-64 overflow-y-auto">
            <p className="text-xs font-medium text-foreground mb-2">
              Salida {status.running ? "(en vivo)" : "(últimas líneas)"}
            </p>
            <pre className="text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap font-mono">
              {status.logTail.join("\n")}
            </pre>
            <div ref={logEndRef} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TranscodeLegacyCard;
