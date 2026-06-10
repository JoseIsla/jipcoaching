import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, Utensils, Dumbbell, Megaphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useClient } from "@/contexts/ClientContext";

type Audience = "NUTRITION" | "TRAINING" | "ALL";

type Announcement = {
  id: string;
  title: string;
  body: string;
  bullets?: string[] | null;
  audience: Audience;
  version?: string | null;
  publishedAt: string;
};

const AudienceIcon = ({ audience }: { audience: Audience }) => {
  if (audience === "NUTRITION") return <Utensils className="h-5 w-5" />;
  if (audience === "TRAINING") return <Dumbbell className="h-5 w-5" />;
  return <Sparkles className="h-5 w-5" />;
};

const audienceLabel = (a: Audience) =>
  a === "NUTRITION" ? "Novedad de Nutrición"
  : a === "TRAINING" ? "Novedad de Entrenamiento"
  : "Novedad general";

/** Blocking modal that shows the latest unread release note for the client. */
const AnnouncementModal = () => {
  const { client } = useClient();
  const [item, setItem] = useState<Announcement | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.get<Announcement | null>("/announcements/pending");
        if (!cancelled) setItem(data ?? null);
      } catch { /* silent */ }
    };
    if (client?.id) load();
    return () => { cancelled = true; };
  }, [client?.id]);

  const handleAck = async () => {
    if (!item || confirming) return;
    setConfirming(true);
    try {
      await api.post(`/announcements/${item.id}/read`, {});
    } catch { /* silent: still close to not block UX */ }
    setItem(null);
    setConfirming(false);
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 safe-area-top"
          // Blocking: do NOT close on outside click
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border-b border-border">
              <div className="flex items-start gap-3">
                <div className="shrink-0 h-11 w-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center ring-1 ring-primary/30">
                  <AudienceIcon audience={item.audience} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Megaphone className="h-3 w-3 text-primary" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {audienceLabel(item.audience)}
                    </span>
                    {item.version && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                        {item.version}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-foreground leading-snug">{item.title}</h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 max-h-[55vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {item.body}
              </p>

              {Array.isArray(item.bullets) && item.bullets.length > 0 && (
                <ul className="mt-4 space-y-2.5">
                  {item.bullets.map((b, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i + 0.1 }}
                      className="flex items-start gap-2.5 text-sm text-foreground"
                    >
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="leading-snug">{b}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 pt-1">
              <Button
                onClick={handleAck}
                disabled={confirming}
                className="w-full h-11 font-semibold"
              >
                {confirming ? <Loader2 className="h-4 w-4 animate-spin" /> : "¡Entendido!"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AnnouncementModal;