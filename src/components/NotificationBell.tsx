import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  // Bagong state para sa Notification Popup
  const [selectedNotification, setSelectedNotification] = useState<any>(null); 

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

  // Kapag kinlick ang notification
  const handleNotificationClick = (n: any) => {
    setSelectedNotification(n);
    setOpen(false); // Isara ang bell dropdown
  };

  return (
    <>
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
                  <div 
                    key={n.id} 
                    className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                    onClick={() => handleNotificationClick(n)}
                  >
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.message}
                    </p>
                    
                    {/* Kung kinlick nila directly ang maliit na link, hindi bubukas ang popup, didiretso sa website */}
                    {n.link_url && (
                      <a
                        href={n.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setOpen(false); 
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {n.link_text || "Link"}
                      </a>
                    )}

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

      {/* ANG BAGONG POPUP (DIALOG) PARA SA FULL NOTIFICATION DETAILS */}
      <Dialog open={!!selectedNotification} onOpenChange={(isOpen) => !isOpen && setSelectedNotification(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl leading-tight pr-4">
              {selectedNotification?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-2">
            {/* Full message. May scroll kung sakaling sobrang haba */}
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              {selectedNotification?.message}
            </div>
            
            {/* Malaking button para sa link sa loob ng popup */}
            {selectedNotification?.link_url && (
              <div className="pt-2">
                <Button asChild className="w-full gap-2">
                  <a href={selectedNotification.link_url} target="_blank" rel="noopener noreferrer">
                    {selectedNotification.link_text || "Click here"}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            )}

            <div className="pt-4 border-t border-border/50 text-xs text-muted-foreground">
              Published on {selectedNotification?.created_at && format(new Date(selectedNotification.created_at), "MMMM dd, yyyy 'at' h:mm a")}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
