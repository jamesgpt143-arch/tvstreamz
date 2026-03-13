import { useState } from 'react';
import { Plus, Pencil, Trash2, Tv, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChannels, useDeleteChannel, type DbChannel } from '@/hooks/useChannels';
import { ChannelForm } from './ChannelForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export function ChannelManager() {
  const { data: channels, isLoading } = useChannels(true); // Include inactive
  const deleteChannel = useDeleteChannel();
  const [showForm, setShowForm] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DbChannel | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DbChannel | null>(null);

  const handleEdit = (channel: DbChannel) => {
    setEditingChannel(channel);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteChannel.mutateAsync(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingChannel(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Tv className="h-5 w-5" />
            Channel Management
          </CardTitle>
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Channel
          </Button>
        </CardHeader>
        <CardContent>
          {channels?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tv className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No channels yet. Add your first channel!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {channels?.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <img
                    src={channel.logo_url || '/placeholder.svg'}
                    alt={channel.name}
                    className="w-10 h-10 object-contain rounded-lg bg-background p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{channel.name}</p>
                      {channel.is_active ? (
                        <Badge variant="outline" className="text-green-500 border-green-500/50 gap-1">
                          <Check className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground gap-1">
                          <X className="h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {channel.stream_type.toUpperCase()} • {channel.category || 'General'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(channel)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(channel)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Channel Form Modal */}
      {showForm && (
        <ChannelForm
          channel={editingChannel}
          onClose={handleFormClose}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
