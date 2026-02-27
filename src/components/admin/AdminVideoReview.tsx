/**
 * Admin-side video review for technique videos.
 * Shows active videos with expiry info.
 */
import { Video, Clock, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMediaStore } from "@/data/useMediaStore";

interface Props {
  clientId: string;
}

const daysUntilExpiry = (expiresAt: string): number => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const AdminVideoReview = ({ clientId }: Props) => {
  const activeVideos = useMediaStore((s) => s.getActiveVideos(clientId));

  if (activeVideos.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <Film className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin videos de técnica activos</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          Videos de Técnica
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {activeVideos.length} activos
          </Badge>
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {activeVideos.map((video) => {
          const remaining = daysUntilExpiry(video.expiresAt);
          return (
            <div key={video.id} className="bg-muted/30 rounded-lg overflow-hidden">
              <video
                src={video.url}
                controls
                preload="metadata"
                className="w-full aspect-video bg-black rounded-t-lg"
              />
              <div className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">{video.exerciseName}</p>
                  <Badge
                    variant="outline"
                    className={`text-[9px] gap-1 ${
                      remaining <= 2 ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                    }`}
                  >
                    <Clock className="h-2.5 w-2.5" />
                    Expira en {remaining}d
                  </Badge>
                </div>
                {video.notes && <p className="text-xs text-muted-foreground">{video.notes}</p>}
                <p className="text-[10px] text-muted-foreground">
                  Subido: {new Date(video.uploadedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminVideoReview;
