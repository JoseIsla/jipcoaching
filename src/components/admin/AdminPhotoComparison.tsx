/**
 * Admin-side photo gallery + side-by-side comparison for a client.
 * Shows chronological gallery with option to compare between two dates.
 */
import { useState, useMemo } from "react";
import { Camera, ArrowLeftRight, Calendar, ImageIcon } from "lucide-react";
import MediaCommentThread from "./MediaCommentThread";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMediaStore } from "@/data/useMediaStore";
import type { PhotoAngle } from "@/types/media";

interface Props {
  clientId: string;
}

const angleLabels: Record<PhotoAngle, string> = { front: "Frente", side: "Lateral", back: "Espalda" };

const AdminPhotoComparison = ({ clientId }: Props) => {
  const getPhotoSessions = useMediaStore((s) => s.getPhotoSessions);
  const sessions = getPhotoSessions(clientId);
  const [compareMode, setCompareMode] = useState(false);
  const [dateA, setDateA] = useState<string>("");
  const [dateB, setDateB] = useState<string>("");
  const [selectedAngle, setSelectedAngle] = useState<PhotoAngle>("front");

  const sessionA = useMemo(() => sessions.find((s) => s.date === dateA), [sessions, dateA]);
  const sessionB = useMemo(() => sessions.find((s) => s.date === dateB), [sessions, dateB]);

  const photoA = sessionA?.photos.find((p) => p.angle === selectedAngle);
  const photoB = sessionB?.photos.find((p) => p.angle === selectedAngle);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

  if (sessions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">El cliente aún no ha subido fotos de progreso</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          Fotos de Progreso
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
            {sessions.length} sesiones
          </Badge>
        </h3>
        {sessions.length >= 2 && (
          <Button
            size="sm"
            variant={compareMode ? "default" : "outline"}
            className="text-xs gap-1.5"
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode && sessions.length >= 2) {
                setDateA(sessions[sessions.length - 1].date);
                setDateB(sessions[0].date);
              }
            }}
          >
            <ArrowLeftRight className="h-3 w-3" />
            Comparar
          </Button>
        )}
      </div>

      {/* Comparison Mode */}
      {compareMode && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Fecha inicial</label>
              <Select value={dateA} onValueChange={setDateA}>
                <SelectTrigger className="bg-muted/50 border-border text-xs h-8">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sessions.map((s) => (
                    <SelectItem key={s.date} value={s.date} className="text-xs">
                      {formatDate(s.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Fecha actual</label>
              <Select value={dateB} onValueChange={setDateB}>
                <SelectTrigger className="bg-muted/50 border-border text-xs h-8">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sessions.map((s) => (
                    <SelectItem key={s.date} value={s.date} className="text-xs">
                      {formatDate(s.date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Angle selector */}
          <div className="flex gap-1.5">
            {(["front", "side", "back"] as PhotoAngle[]).map((angle) => (
              <Button
                key={angle}
                size="sm"
                variant={selectedAngle === angle ? "default" : "outline"}
                className="text-xs flex-1"
                onClick={() => setSelectedAngle(angle)}
              >
                {angleLabels[angle]}
              </Button>
            ))}
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground text-center">{dateA ? formatDate(dateA) : "—"}</p>
              {photoA ? (
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/50">
                  <img src={photoA.url} alt="Before" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-lg bg-muted/30 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground text-center">{dateB ? formatDate(dateB) : "—"}</p>
              {photoB ? (
                <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/50">
                  <img src={photoB.url} alt="After" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-[3/4] rounded-lg bg-muted/30 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chronological Gallery */}
      {!compareMode && (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.date} className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                {formatDate(session.date)}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {session.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted/50 group">
                    <img
                      src={photo.url}
                      alt={`${photo.angle} - ${session.date}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-background/80 text-foreground px-1.5 py-0.5 rounded capitalize">
                      {angleLabels[photo.angle]}
                    </span>
                  </div>
                ))}
              </div>
              {/* Session-level comment thread */}
              <MediaCommentThread
                targetType="photo_session"
                targetId={session.date}
                clientId={clientId}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPhotoComparison;
