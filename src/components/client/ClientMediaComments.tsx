/**
 * Read-only comment display for client-facing media sections.
 * Shows coach feedback on photos/videos with avatar.
 */
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMediaStore } from "@/data/useMediaStore";
import { API_BASE_URL } from "@/services/api";
import type { MediaComment } from "@/types/media";

interface Props {
  targetType: MediaComment["targetType"];
  targetId: string;
}

/** Resolve relative upload URLs to full server URLs */
const resolveAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${serverRoot}${url}`;
};

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
          <div className="flex items-start gap-2 mb-0.5">
            <Avatar className="h-5 w-5 shrink-0 mt-0.5">
              <AvatarImage src={c.authorAvatarUrl} alt={c.authorName} />
              <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                {c.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
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
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientMediaComments;
