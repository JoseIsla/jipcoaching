import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useContactLeadsStore, type ContactLead } from "@/data/useContactLeadsStore";
import { motion } from "framer-motion";
import { Mail, Phone, User, Trash2, Eye, EyeOff, MessageSquare, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const AdminLeads = () => {
  const { leads, markAsRead, deleteLead, fetchLeads } = useContactLeadsStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = leads.find((l) => l.id === selectedId);

  const handleSelect = (lead: ContactLead) => {
    setSelectedId(lead.id);
    if (!lead.read) markAsRead(lead.id);
  };

  const stagger = { animate: { transition: { staggerChildren: 0.05 } } };
  const fadeUp = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  return (
    <AdminLayout>
      <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-6">
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            Leads de contacto
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mensajes recibidos desde la landing page
          </p>
        </motion.div>

        {leads.length === 0 ? (
          <motion.div variants={fadeUp} className="text-center py-20">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No hay mensajes aún</p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            {/* List */}
            <motion.div variants={fadeUp} className="lg:col-span-2 space-y-2">
              {leads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => handleSelect(lead)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedId === lead.id
                      ? "bg-primary/10 border-primary/40"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground truncate">{lead.name}</p>
                        {!lead.read && (
                          <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">
                            Nuevo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{lead.email}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">{lead.message}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(lead.createdAt), "d MMM", { locale: es })}
                    </span>
                  </div>
                </button>
              ))}
            </motion.div>

            {/* Detail */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
              {selected ? (
                <div className="bg-card border border-border rounded-xl p-6 space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        {selected.name}
                      </h2>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(selected.createdAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { deleteLead(selected.id); setSelectedId(null); }}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 bg-background rounded-lg p-3 border border-border">
                      <Mail className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Email</p>
                        <a href={`mailto:${selected.email}`} className="text-sm text-foreground hover:text-primary transition-colors">
                          {selected.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-background rounded-lg p-3 border border-border">
                      <Phone className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground">Teléfono</p>
                        <a href={`tel:${selected.phone}`} className="text-sm text-foreground hover:text-primary transition-colors">
                          {selected.phone}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" /> Mensaje
                    </p>
                    <div className="bg-background border border-border rounded-lg p-4">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selected.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <Eye className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Selecciona un mensaje para ver los detalles
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default AdminLeads;
