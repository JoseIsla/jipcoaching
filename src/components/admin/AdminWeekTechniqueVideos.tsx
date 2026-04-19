/**
 * Admin: technique videos uploaded in this week's TRAINING check-ins.
 *
 * Source: useQuestionnaireStore → entries (category=training) of the last
 * 7 days that contain `techniqueVideos`. We do NOT use TechniqueVideo
 * (those are standalone uploads); we surface what the client uploaded as
 * part of their weekly check-in so the coach can review them from
 * Progress without opening Check-ins.
 *
 * Each video gets a comment thread bound to its `techniqueVideoId` so
 * comments stay in sync with the ones in the Check-ins page.
 */
import { useEffect, useMemo } from "react";
import { Video, Film, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuestionnaireStore } from "@/data/useQuestionnaireStore";
import MediaCommentThread from "./MediaCommentThread";

interface Props {
  clientId: string;
  /** Window size in days. Default 7 → last week. */
  windowDays?: number;
}

const AdminWeekTechniqueVideos = ({ clientId, windowDays = 7 }: Props) => {
  const entries = useQuestionnaireStore((s) => s.entries);
  const fetchEntries = useQuestionnaireStore((s) => s.fetchEntries);

  useEffect(() => {
    fetchEntries(clientId);
  }, [clientId, fetchEntries]);

  const weekVideos = useMemo(() => {
    const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    type Item = {
      id: string;
      techniqueVideoId?: string;
      exerciseName: string;
      url: string;
      notes?: string;
      uploadedAt: string;
      entryDate: string;
    };
    const out: Item[] = [];
    for (const e of entries) {
      if (e.clientId !== clientId) continue;
      if (e.category !== "training") continue;
      const refDate = new Date(e.respondedAt || e.scheduledFor || e.dueDate || 0).getTime();
      if (!refDate || refDate < cutoff) continue;
      for (const v of e.techniqueVideos ?? []) {
        out.push({
          id: v.id,
          techniqueVideoId: v.techniqueVideoId,
          exerciseName: v.exerciseName,
          url: v.url,
          notes: v.notes,
          uploadedAt: v.uploadedAt,
          entryDate: e.scheduledFor || e.dueDate || "",
        });
      }
    }
    // Newest first
    return out.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [entries, clientId, windowDays]);

  if (weekVideos.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <Film className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">Vídeos de técnica de la semana</p>
        <p className="text-xs text-muted-foreground mt-1">
          Aún no hay vídeos en los check-ins de entrenamiento de los últimos {windowDays} días.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          Vídeos de técnica de la semana
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {weekVideos.length}
          </Badge>
        </h3>
        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
          <MessageSquare className="h-3 w-3" /> Comentarios sincronizados con check-ins
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {weekVideos.map((v) => (
          <div key={v.id} className="bg-muted/30 rounded-lg overflow-hidden">
            <video
              src={v.url}
              controls
              preload="metadata"
              playsInline
              className="w-full aspect-video bg-black rounded-t-lg"
            />
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{v.exerciseName}</p>
                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                  {new Date(v.uploadedAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {v.notes && <p className="text-xs text-muted-foreground">{v.notes}</p>}
              <MediaCommentThread
                targetType="video"
                targetId={v.techniqueVideoId || v.id}
                clientId={clientId}
                exerciseName={v.exerciseName}
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminWeekTechniqueVideos;
