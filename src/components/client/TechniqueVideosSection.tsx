/**
 * Client-side video upload for technique review.
 * Shows in Progress tab for training clients.
 * Videos auto-expire after 6 days.
 */
import { useState, useRef, useEffect } from "react";
import { Video, Upload, Clock, Trash2, Film, Loader2 } from "lucide-react";
import ClientMediaComments from "./ClientMediaComments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMediaStore } from "@/data/useMediaStore";
import { MAX_VIDEO_SIZE_MB, VIDEO_EXPIRY_DAYS, type TechniqueVideo } from "@/types/media";
import { compressVideo } from "@/utils/compressMedia";
import { mediaApi } from "@/services/mediaApi";
import { useClient } from "@/contexts/ClientContext";

interface Props {
  clientId: string;
}

const daysUntilExpiry = (expiresAt: string): number => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const TechniqueVideosSection = ({ clientId }: Props) => {
  const { toast } = useToast();
  const getActiveVideosFn = useMediaStore((s) => s.getActiveVideos);
  const addVideo = useMediaStore((s) => s.addVideo);
  const removeVideoFromStore = useMediaStore((s) => s.removeVideo);
  const fetchVideos = useMediaStore((s) => s.fetchVideos);
  const fetchComments = useMediaStore((s) => s.fetchComments);

  // Fetch videos and comments from API on mount
  useEffect(() => {
    fetchVideos(clientId);
    fetchComments(clientId);
  }, [clientId]);

  const activeVideos = getActiveVideosFn(clientId);

  const [showUpload, setShowUpload] = useState(false);
  const [compressingVideo, setCompressingVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Formato no válido", description: "Solo se permiten videos", variant: "destructive" });
      return;
    }

    // Auto-compress if over size limit
    let processedFile = file;
    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setCompressingVideo(true);
      try {
        processedFile = await compressVideo(file, { maxSizeMB: MAX_VIDEO_SIZE_MB });
        const savedMB = ((file.size - processedFile.size) / (1024 * 1024)).toFixed(1);
        toast({ title: "Video comprimido ✅", description: `Se redujo ${savedMB}MB automáticamente` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : `El video excede ${MAX_VIDEO_SIZE_MB}MB y no se pudo comprimir`;
        toast({ title: "No se pudo comprimir", description: msg, variant: "destructive" });
        setCompressingVideo(false);
        return;
      }
      setCompressingVideo(false);
    }

    setSelectedFile(processedFile);
  };

  const handleUpload = async () => {
    if (!selectedFile || !exerciseName.trim()) {
      toast({ title: "Campos requeridos", description: "Indica el ejercicio y selecciona un video", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const uploaded = await mediaApi.uploadTechniqueVideo(
        clientId,
        selectedFile,
        exerciseName.trim(),
        notes.trim() || undefined,
      );
      addVideo(uploaded);
      toast({ title: "Video subido ✅", description: `Se eliminará automáticamente en ${VIDEO_EXPIRY_DAYS} días` });
      setSelectedFile(null);
      setExerciseName("");
      setNotes("");
      setShowUpload(false);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "No se pudo subir el video", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    try {
      await mediaApi.deleteTechniqueVideo(clientId, videoId);
    } catch { /* ignore */ }
    // Update store locally (don't call store's removeVideo which also hits API)
    useMediaStore.setState((s) => ({ videos: s.videos.filter((v) => v.id !== videoId) }));
    toast({ title: "Video eliminado" });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-primary" />
          Videos de técnica
        </h3>
        <Button
          size="sm"
          variant="outline"
          className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setShowUpload(!showUpload)}
        >
          <Upload className="h-3 w-3" />
          Subir video
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Los videos se eliminan automáticamente del servidor a los {VIDEO_EXPIRY_DAYS} días.
      </p>

      {/* Upload zone */}
      {showUpload && (
        <div className="space-y-3 bg-muted/30 rounded-lg p-3">
          <div className="space-y-2">
            <Input
              value={exerciseName}
              onChange={(e) => setExerciseName(e.target.value)}
              placeholder="Nombre del ejercicio (ej: Sentadilla)"
              className="bg-background border-border text-sm"
            />
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas (opcional)"
              className="bg-background border-border text-sm"
            />
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
          />

          <button
            onClick={() => fileRef.current?.click()}
            disabled={compressingVideo}
            className={`w-full py-6 rounded-lg border-2 border-dashed flex flex-col items-center gap-2 transition-colors ${
              compressingVideo
                ? "border-primary/50 bg-primary/5 animate-pulse"
                : selectedFile
                ? "border-primary/50 bg-primary/5"
                : "border-border hover:border-primary/30 hover:bg-muted/50"
            }`}
          >
            {compressingVideo ? (
              <>
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <span className="text-xs text-primary font-medium">Comprimiendo video…</span>
              </>
            ) : (
              <>
                <Film className="h-6 w-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {selectedFile ? selectedFile.name : `Seleccionar video (se comprime automáticamente)`}
                </span>
              </>
            )}
          </button>

          <Button
            size="sm"
            className="w-full gap-2"
            onClick={handleUpload}
            disabled={uploading || compressingVideo || !selectedFile || !exerciseName.trim()}
          >
            {uploading ? "Subiendo..." : "Subir video"}
          </Button>
        </div>
      )}

      {/* Video list */}
      {activeVideos.length > 0 ? (
        <div className="space-y-2">
          {activeVideos.map((video) => {
            const remaining = daysUntilExpiry(video.expiresAt);
            return (
              <div key={video.id} className="bg-muted/30 rounded-lg overflow-hidden">
                <video
                  src={video.url}
                  controls
                  preload="metadata"
                  className="w-full max-h-48 bg-black rounded-t-lg"
                />
                <div className="p-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{video.exerciseName}</p>
                    {video.notes && <p className="text-[10px] text-muted-foreground truncate">{video.notes}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(video.uploadedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[9px] gap-1 ${
                        remaining <= 2 ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                      }`}
                    >
                      <Clock className="h-2.5 w-2.5" />
                      {remaining}d
                    </Badge>
                    <button
                      onClick={() => handleRemoveVideo(video.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <ClientMediaComments targetType="video" targetId={video.id} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-4">
          <Video className="h-8 w-8 text-muted-foreground/50 mx-auto mb-1" />
          <p className="text-sm text-muted-foreground">Sin videos activos</p>
        </div>
      )}
    </div>
  );
};

export default TechniqueVideosSection;
