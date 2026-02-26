import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Check, CheckCheck, X, ClipboardList, UserPlus, Dumbbell, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotificationStore, type NotificationType } from "@/data/notificationStore";

const typeIcon: Record<NotificationType, typeof Bell> = {
  checkin: ClipboardList,
  client: UserPlus,
  plan: Dumbbell,
  system: Info,
};

const typeColor: Record<NotificationType, string> = {
  checkin: "bg-accent/15 text-accent",
  client: "bg-primary/15 text-primary",
  plan: "bg-destructive/15 text-destructive",
  system: "bg-secondary text-muted-foreground",
};

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days}d`;
}

const AdminHeader = () => {
  const { profile, loading } = useAdminProfile();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification } =
    useNotificationStore();

  const initials = profile
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "";

  const handleNotificationClick = (id: string, link?: string) => {
    markAsRead(id);
    if (link) {
      setOpen(false);
      navigate(link);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 lg:px-8 shrink-0">
      <div className="relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar clientes, planes..."
          className="pl-10 bg-muted border-border h-9 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="h-5 w-5" />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center"
                  >
                    {unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-80 p-0 bg-card border-border shadow-xl"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                {unreadCount > 0 && (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:underline"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todo
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">Sin notificaciones</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((notif) => {
                    const Icon = typeIcon[notif.type];
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          onClick={() => handleNotificationClick(notif.id, notif.link)}
                          className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 cursor-pointer transition-colors group ${
                            notif.read
                              ? "hover:bg-muted/30"
                              : "bg-primary/[0.03] hover:bg-primary/[0.06]"
                          }`}
                        >
                          <div
                            className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeColor[notif.type]}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p
                                className={`text-xs leading-tight ${
                                  notif.read
                                    ? "font-medium text-foreground/70"
                                    : "font-semibold text-foreground"
                                }`}
                              >
                                {notif.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notif.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0 p-0.5"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                              {notif.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground">
                                {timeAgo(notif.timestamp)}
                              </span>
                              {!notif.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                  }}
                                  className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                  Leída
                                </button>
                              )}
                            </div>
                          </div>
                          {!notif.read && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-3">
          {loading ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="hidden sm:block space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </>
          ) : (
            <>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground leading-none">{profile?.name}</p>
                <p className="text-xs text-muted-foreground">{profile?.role}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
