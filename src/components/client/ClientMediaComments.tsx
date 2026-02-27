/**
 * Read-only comment display for client-facing media sections.
 * Shows coach feedback on photos/videos.
 */
import { MessageSquare } from "lucide-react";
import { useMediaStore } from "@/data/useMediaStore";
import type { MediaComment } from "@/types/media";

interface Props {
  targetType: MediaComment["targetType"];
  targetId: string;
}

const ClientMediaComments = ({ targetType, targetId }: Props) => {
  const getComments = useMediaStore((s) => s.getComments);
  const comments = getComments(targetType, targetId);

  if (comments.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {comments.map((c) => (
        <div
          key={c.id}
          className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2"
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <MessageSquare className="h-2.5 w-2.5 text-primary" />
            <span className="text-[10px] font-semibold text-primary">{c.authorName}</span>
            <span className="text-[9px] text-muted-foreground">
              {new Date(c.createdAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          <p className="text-xs text-foreground whitespace-pre-line">{c.text}</p>
        </div>
      ))}
    </div>
  );
};

export default ClientMediaComments;
