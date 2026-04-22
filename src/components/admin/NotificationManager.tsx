import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function NotificationManager() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .insert({ title, message });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setTitle("");
      setMessage("");
      toast.success("Notification published!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5" />
            Create Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Notification message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!title.trim() || !message.trim() || createMutation.isPending}
          >
            <Bell className="h-4 w-4 mr-2" />
            Publish Notification
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm">No notifications yet</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n: any) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{n.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(n.created_at), "MMM dd, yyyy h:mm a")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive shrink-0"
                    onClick={() => deleteMutation.mutate(n.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
