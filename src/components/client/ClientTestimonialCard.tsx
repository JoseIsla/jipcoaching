import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, MessageSquare, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useTestimonialStore } from "@/data/useTestimonialStore";
import { useClient } from "@/contexts/ClientContext";
import { useToast } from "@/hooks/use-toast";

const ClientTestimonialCard = () => {
  const { client } = useClient();
  const fetchTestimonials = useTestimonialStore((s) => s.fetchTestimonials);
  useEffect(() => { fetchTestimonials(); }, []);
  const existing = useTestimonialStore((s) => s.getByClient(client.id));
  const addTestimonial = useTestimonialStore((s) => s.addTestimonial);
  const { toast } = useToast();

  const [text, setText] = useState(existing?.text ?? "");
  const [rating, setRating] = useState(existing?.rating ?? 5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!text.trim() || text.trim().length < 10) {
      toast({
        title: "Testimonio muy corto",
        description: "Escribe al menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }
    addTestimonial({
      clientId: client.id,
      clientName: client.name,
      text: text.trim(),
      rating,
    });
    setSubmitted(true);
    toast({ title: "¡Gracias!", description: "Tu testimonio se ha publicado en la web." });
  };

  if (submitted && !existing) {
    // Just submitted for first time — show confirmation briefly
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-primary/30 rounded-xl p-5 text-center"
      >
        <Check className="h-8 w-8 text-primary mx-auto mb-2" />
        <p className="text-sm font-semibold text-foreground">¡Testimonio publicado!</p>
        <p className="text-xs text-muted-foreground mt-1">Aparecerá en la landing page.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.46 }}
      className="bg-card border border-border rounded-xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {existing ? "Tu testimonio" : "Deja tu testimonio"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {existing ? "Puedes actualizarlo en cualquier momento" : "Aparecerá en nuestra web"}
          </p>
        </div>
      </div>

      {/* Star rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                star <= (hoveredStar || rating)
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cuéntanos tu experiencia..."
        rows={3}
        maxLength={300}
        className="bg-background border-border resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{text.length}/300</span>
        <button
          onClick={handleSubmit}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all"
        >
          {existing ? "Actualizar" : "Publicar"}
        </button>
      </div>
    </motion.div>
  );
};

export default ClientTestimonialCard;
