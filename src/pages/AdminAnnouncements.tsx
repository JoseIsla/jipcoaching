import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { motion } from "framer-motion";
import {
  Megaphone, Plus, Trash2, Edit3, X, Check, Sparkles, Utensils, Dumbbell, Eye, EyeOff, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { api } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type Audience = "NUTRITION" | "TRAINING" | "ALL";

type Announcement = {
  id: string;
  title: string;
  body: string;
  bullets: string[] | null;
  audience: Audience;
  version: string | null;
  active: boolean;
  publishedAt: string;
  createdAt: string;
  _count?: { reads: number };
};

type FormState = {
  id?: string;
  title: string;
  body: string;
  bullets: string[];
  audience: Audience;
  version: string;
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  body: "",
  bullets: [""],
  audience: "ALL",
  version: "",
  active: true,
};

const audienceMeta: Record<Audience, { label: string; icon: typeof Sparkles; color: string }> = {
  ALL:       { label: "Todos",         icon: Sparkles, color: "text-primary bg-primary/10" },
  NUTRITION: { label: "Nutrición",     icon: Utensils, color: "text-amber-500 bg-amber-500/10" },
  TRAINING:  { label: "Entrenamiento", icon: Dumbbell, color: "text-blue-500 bg-blue-500/10" },
};

const AudienceBadge = ({ a }: { a: Audience }) => {
  const m = audienceMeta[a];
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${m.color}`}>
      <Icon className="h-3 w-3" /> {m.label}
    </span>
  );
};

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Announcement[]>("/announcements");
      setItems(data);
    } catch {
      toast({ title: "Error", description: "No se pudieron cargar las novedades", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => setEditing({ ...emptyForm, bullets: [""] });
  const openEdit = (a: Announcement) =>
    setEditing({
      id: a.id,
      title: a.title,
      body: a.body,
      bullets: (a.bullets && a.bullets.length > 0) ? [...a.bullets] : [""],
      audience: a.audience,
      version: a.version ?? "",
      active: a.active,
    });

  const updateBullet = (i: number, v: string) => {
    if (!editing) return;
    const next = [...editing.bullets];
    next[i] = v;
    setEditing({ ...editing, bullets: next });
  };
  const addBullet = () => editing && setEditing({ ...editing, bullets: [...editing.bullets, ""] });
  const removeBullet = (i: number) => {
    if (!editing) return;
    const next = editing.bullets.filter((_, idx) => idx !== i);
    setEditing({ ...editing, bullets: next.length > 0 ? next : [""] });
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.body.trim()) {
      toast({ title: "Faltan campos", description: "Título y descripción son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      title: editing.title.trim(),
      body: editing.body.trim(),
      bullets: editing.bullets.map((b) => b.trim()).filter(Boolean),
      audience: editing.audience,
      version: editing.version.trim() || null,
      active: editing.active,
    };
    try {
      if (editing.id) {
        await api.patch(`/announcements/${editing.id}`, payload);
        toast({ title: "Novedad actualizada" });
      } else {
        await api.post("/announcements", payload);
        toast({ title: "Novedad publicada", description: "Los clientes la verán en su próximo acceso" });
      }
      setEditing(null);
      await load();
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err?.message ?? "Inténtalo de nuevo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await api.patch(`/announcements/${a.id}`, { active: !a.active });
      await load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`¿Eliminar "${a.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/announcements/${a.id}`);
      toast({ title: "Novedad eliminada" });
      await load();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-primary" />
              Novedades
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Anuncios emergentes que verán los clientes según su pack
            </p>
          </div>
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> Nueva novedad
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Megaphone className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Todavía no has publicado ninguna novedad</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border bg-card ${a.active ? "border-border" : "border-border/40 opacity-70"}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <AudienceBadge a={a.audience} />
                      {a.version && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
                          {a.version}
                        </span>
                      )}
                      {!a.active && (
                        <Badge variant="outline" className="text-[10px]">Inactivo</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground truncate">{a.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{a.body}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80 mt-2">
                      <span>{format(new Date(a.publishedAt), "d MMM yyyy · HH:mm", { locale: es })}</span>
                      {typeof a._count?.reads === "number" && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {a._count.reads} leídas
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => toggleActive(a)} title={a.active ? "Desactivar" : "Activar"}>
                      {a.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)} title="Editar">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(a)} title="Eliminar" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Editor overlay */}
      {editing && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-primary" />
                {editing.id ? "Editar novedad" : "Nueva novedad"}
              </h2>
              <Button size="icon" variant="ghost" onClick={() => setEditing(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {/* Audience */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block">Audiencia</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["NUTRITION", "TRAINING", "ALL"] as Audience[]).map((a) => {
                    const m = audienceMeta[a];
                    const Icon = m.icon;
                    const active = editing.audience === a;
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setEditing({ ...editing, audience: a })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                          active ? "border-primary bg-primary/10" : "border-border bg-background hover:border-primary/40"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${active ? "text-primary" : "text-foreground"}`}>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {editing.audience === "ALL"
                    ? "Visible para todos los clientes."
                    : editing.audience === "NUTRITION"
                    ? "Solo clientes con pack Nutrición o Full."
                    : "Solo clientes con pack Entrenamiento o Full."}
                </p>
              </div>

              {/* Title + version */}
              <div className="grid sm:grid-cols-[1fr_auto] gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Título *</label>
                  <Input
                    value={editing.title}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                    placeholder="Ej. Nuevo registro de cargas en entrenamiento"
                    maxLength={180}
                  />
                </div>
                <div className="sm:w-32">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Versión</label>
                  <Input
                    value={editing.version}
                    onChange={(e) => setEditing({ ...editing, version: e.target.value })}
                    placeholder="v1.4"
                    maxLength={40}
                  />
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Descripción *</label>
                <Textarea
                  value={editing.body}
                  onChange={(e) => setEditing({ ...editing, body: e.target.value })}
                  placeholder="Cuenta a tus clientes qué hay nuevo y cómo les beneficia…"
                  rows={4}
                  maxLength={5000}
                />
              </div>

              {/* Bullets */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">Lista de cambios</label>
                <div className="space-y-2">
                  {editing.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <Input
                        value={b}
                        onChange={(e) => updateBullet(i, e.target.value)}
                        placeholder={`Cambio ${i + 1}`}
                        maxLength={300}
                      />
                      <Button size="icon" variant="ghost" onClick={() => removeBullet(i)} className="shrink-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={addBullet} className="mt-2 gap-1.5 text-primary">
                  <Plus className="h-3.5 w-3.5" /> Añadir punto
                </Button>
              </div>

              {/* Active */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                <div>
                  <p className="text-sm font-medium text-foreground">Publicar (activo)</p>
                  <p className="text-[11px] text-muted-foreground">Si está activo, los clientes lo verán al entrar.</p>
                </div>
                <Switch
                  checked={editing.active}
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })}
                />
              </div>
            </div>

            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Guardando…" : editing.id ? "Guardar cambios" : "Publicar novedad"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAnnouncements;