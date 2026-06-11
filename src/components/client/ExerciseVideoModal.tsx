import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildYouTubeEmbedUrl } from "@/utils/youtube";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exerciseName: string;
  videoUrl?: string | null;
}

const ExerciseVideoModal = ({ open, onOpenChange, exerciseName, videoUrl }: Props) => {
  const embedUrl = buildYouTubeEmbedUrl(videoUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card border-border p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">{exerciseName}</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-5">
          {embedUrl ? (
            <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={embedUrl}
                title={exerciseName}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Vídeo no disponible todavía.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseVideoModal;