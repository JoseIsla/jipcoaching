import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAdminProfile } from "@/contexts/AdminProfileContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

const AdminHeader = () => {
  const { profile, loading } = useAdminProfile();

  const initials = profile
    ? profile.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
    : "";

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
        <button className="relative text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
        </button>

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
