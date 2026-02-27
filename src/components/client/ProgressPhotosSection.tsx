/**
 * Client-side photo upload & gallery for progress tracking.
 * Shows in Progress tab for nutrition clients.
 */
import { useState, useRef } from "react";
import { Camera, Upload, Clock, CheckCircle2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediaStore } from "@/data/useMediaStore";
import { PHOTO_ANGLES, MAX_PHOTO_SIZE_MB, MIN_PHOTO_WIDTH, MIN_PHOTO_HEIGHT, getImageDimensions, type PhotoAngle, type ProgressPhoto } from "@/types/media";

interface Props {
  clientId: string;
}

const ProgressPhotosSection = ({ clientId }: Props) => {
  const { toast } = useToast();
  const getPhotoSessions = useMediaStore((s) => s.getPhotoSessions);
  const canUploadFn = useMediaStore((s) => s.canUploadPhotos);
  const getNextPhotoDateFn = useMediaStore((s) => s.getNextPhotoDate);
  const addPhotoBatch = useMediaStore((s) => s.addPhotoBatch);

  const sessions = getPhotoSessions(clientId);
  const canUpload = canUploadFn(clientId);
  const nextDate = getNextPhotoDateFn(clientId);

  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<Record<PhotoAngle, File | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [previews, setPreviews] = useState<Record<PhotoAngle, string | null>>({
    front: null,
    side: null,
    back: null,
  });
  const [showUpload, setShowUpload] = useState(false);

  const fileRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  const handleFileSelect = async (angle: PhotoAngle, file: File | null) => {
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: `Máximo ${MAX_PHOTO_SIZE_MB}MB por foto`, variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Formato no válido", description: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }
    try {
      const { width, height } = await getImageDimensions(file);
      if (width < MIN_PHOTO_WIDTH || height < MIN_PHOTO_HEIGHT) {
        toast({
          title: "Resolución insuficiente",
          description: `Mínimo ${MIN_PHOTO_WIDTH}×${MIN_PHOTO_HEIGHT}px. Tu foto es ${width}×${height}px.`,
          variant: "destructive",
        });
        return;
      }
    } catch {
      toast({ title: "Error", description: "No se pudo leer la imagen", variant: "destructive" });
      return;
    }
    setPendingFiles((prev) => ({ ...prev, [angle]: file }));
    const url = URL.createObjectURL(file);
    setPreviews((prev) => ({ ...prev, [angle]: url }));
  };

  const handleUpload = async () => {
    const filled = Object.values(pendingFiles).filter(Boolean);
    if (filled.length === 0) {
      toast({ title: "Sin fotos", description: "Selecciona al menos una foto", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // Mock upload — replace with mediaApi.uploadProgressPhoto calls
      const sessionDate = new Date().toISOString().split("T")[0];
      const newPhotos: ProgressPhoto[] = [];

      for (const [angle, file] of Object.entries(pendingFiles)) {
        if (!file) continue;
        newPhotos.push({
          id: `ph-${Date.now()}-${angle}`,
          clientId,
          angle: angle as PhotoAngle,
          url: URL.createObjectURL(file),
          sessionDate,
          uploadedAt: new Date().toISOString(),
        });
      }

      addPhotoBatch(newPhotos);
      toast({ title: "Fotos subidas ✅", description: `${newPhotos.length} foto(s) guardadas correctamente` });
      setPendingFiles({ front: null, side: null, back: null });
      setPreviews({ front: null, side: null, back: null });
      setShowUpload(false);
    } catch {
      toast({ title: "Error", description: "No se pudieron subir las fotos", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Camera className="h-3.5 w-3.5 text-primary" />
          Fotos de progreso
        </h3>
        {canUpload ? (
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setShowUpload(!showUpload)}
          >
            <Upload className="h-3 w-3" />
            Subir fotos
          </Button>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1">
            <Clock className="h-3 w-3" />
            Próxima: {nextDate ? new Date(nextDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}
          </Badge>
        )}
      </div>

      {/* Upload zone */}
      {showUpload && canUpload && (
        <div className="space-y-3 bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            Sube hasta 3 fotos: frente, lateral y espalda. Máximo {MAX_PHOTO_SIZE_MB}MB por foto. Resolución mínima: {MIN_PHOTO_WIDTH}×{MIN_PHOTO_HEIGHT}px.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {PHOTO_ANGLES.map(({ key, label, emoji }) => (
              <div key={key} className="space-y-1.5">
                <input
                  ref={fileRefs[key]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(key, e.target.files?.[0] ?? null)}
                />
                <button
                  onClick={() => fileRefs[key].current?.click()}
                  className={`w-full aspect-[3/4] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors ${
                    previews[key]
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  {previews[key] ? (
                    <img src={previews[key]!} alt={label} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <>
                      <span className="text-lg">{emoji}</span>
                      <span className="text-[10px] text-muted-foreground">{label}</span>
                    </>
                  )}
                </button>
                {previews[key] && (
                  <div className="flex items-center justify-center gap-1 text-[10px] text-primary">
                    <CheckCircle2 className="h-3 w-3" /> {label}
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleUpload}
            disabled={uploading || Object.values(pendingFiles).every((f) => !f)}
          >
            {uploading ? "Subiendo..." : "Confirmar subida"}
          </Button>
        </div>
      )}

      {/* Gallery */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.slice(0, 3).map((session) => (
            <div key={session.date} className="space-y-1.5">
              <p className="text-[10px] text-muted-foreground font-medium">
                {new Date(session.date).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                {session.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted/50">
                    <img
                      src={photo.url}
                      alt={`${photo.angle} - ${session.date}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <span className="absolute bottom-1 left-1 text-[8px] bg-background/80 text-foreground px-1.5 py-0.5 rounded capitalize">
                      {photo.angle === "front" ? "Frente" : photo.angle === "side" ? "Lateral" : "Espalda"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <ImageIcon className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Aún no has subido fotos de progreso</p>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotosSection;
