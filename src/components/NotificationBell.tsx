import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const STORAGE_KEY = "read_notifications";

function getReadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function markAsRead(ids: string[]) {
  const current = getReadIds();
  const merged = Array.from(new Set([...current, ...ids]));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(getReadIds);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter(
    (n: any) => !readIds.includes(n.id)
  ).length;

  const handleOpen = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen && notifications.length > 0) {
        const allIds = notifications.map((n: any) => n.id);
        markAsRead(allIds);
        setReadIds(getReadIds());
      }
    },
    [notifications]
  );

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="px-4 py-3 border-b border-border">
          <h4 className="text-sm font-semibold text-foreground">Notifications</h4>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n: any) => (
                <div key={n.id} className="px-4 py-3 hover:bg-muted/50 transition-colors">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(n.created_at), "MMM dd, yyyy h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
