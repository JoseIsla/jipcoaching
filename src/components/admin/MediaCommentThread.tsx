/**
 * Reusable comment thread for admin media review.
 * Allows adding/removing comments on photos or videos.
 */
import { useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMediaStore } from "@/data/useMediaStore";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { useClientNotificationStore } from "@/data/useClientNotificationStore";
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
      text: trimmed,
      createdAt: new Date().toISOString(),
    });
    // Notify client about the new comment on their video
    if (targetType === "video" && exerciseName) {
      addClientNotification({
        id: `cn-vc-${Date.now()}`,
        type: "video_comment",
        titleKey: "clientNotifications.videoCommentTitle",
        descriptionKey: "clientNotifications.videoCommentDesc",
        descriptionVars: { exercise: exerciseName },
        timestamp: new Date(),
        read: false,
        link: "/client/checkins",
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
