/**
 * Reusable comment thread for admin media review.
 * Allows adding/removing comments on photos or videos.
 */
import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useMediaStore } from "@/data/useMediaStore";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { useClientNotificationStore } from "@/data/useClientNotificationStore";
import { API_BASE_URL } from "@/services/api";
import type { MediaComment } from "@/types/media";

interface Props {
  targetType: MediaComment["targetType"];
  targetId: string;
  clientId: string;
  /** Used to generate client notification when commenting on a video */
  exerciseName?: string;
  /** Compact mode for inline use */
  compact?: boolean;
}

/** Resolve relative upload URLs to full server URLs */
const resolveAvatarUrl = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith("http") || url.startsWith("blob:")) return url;
  const serverRoot = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${serverRoot}${url}`;
};

const MediaCommentThread = ({ targetType, targetId, clientId, exerciseName, compact = false }: Props) => {
  const getComments = useMediaStore((s) => s.getComments);
  const addComment = useMediaStore((s) => s.addComment);
  const removeComment = useMediaStore((s) => s.removeComment);
  const addClientNotification = useClientNotificationStore((s) => s.addNotification);
  const { profile } = useAdminProfile();

  const comments = getComments(targetType, targetId);
  const [text, setText] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment({
      id: `mc-${Date.now()}`,
      targetType,
      targetId,
      clientId,
      authorName: profile?.name || "Coach",
      authorAvatarUrl: profile?.avatarUrl || undefined,
      text: trimmed,
      createdAt: new Date().toISOString(),
    });
    // Notify client about the new comment (video or photo)
    if (targetType === "video" && exerciseName) {
      addClientNotification({
        id: `cn-vc-${Date.now()}`,
        type: "video_comment",
        titleKey: "clientNotifications.videoCommentTitle",
        descriptionKey: "clientNotifications.videoCommentDesc",
        descriptionVars: { exercise: exerciseName },
        timestamp: new Date(),
        read: false,
        link: "/client/progress",
      });
    } else if (targetType === "photo_session") {
      addClientNotification({
        id: `cn-pc-${Date.now()}`,
        type: "video_comment",
        titleKey: "clientNotifications.photoCommentTitle",
        descriptionKey: "clientNotifications.photoCommentDesc",
        timestamp: new Date(),
        read: false,
        link: "/client/progress",
      });
    }
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (compact && comments.length === 0 && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
      >
        <MessageSquare className="h-3 w-3" />
        Comentar
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toggle for compact mode */}
      {compact && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[10px] font-medium text-primary hover:underline"
        >
          <MessageSquare className="h-3 w-3" />
          {comments.length > 0 ? `${comments.length} comentario(s)` : "Comentar"}
        </button>
      )}

      {(!compact || expanded) && (
        <>
          {/* Existing comments */}
          {comments.length > 0 && (
            <div className="space-y-1.5">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                        <AvatarImage src={c.authorAvatarUrl} alt={c.authorName} />
                        <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                          {c.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-semibold text-primary">{c.authorName}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(c.createdAt).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-foreground mt-0.5 whitespace-pre-line">{c.text}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5 shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-1.5">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un comentario..."
              className="bg-muted/50 border-border text-xs min-h-[32px] h-8 resize-none py-1.5"
              rows={1}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0 text-primary hover:bg-primary/10"
              onClick={handleSubmit}
              disabled={!text.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default MediaCommentThread;
