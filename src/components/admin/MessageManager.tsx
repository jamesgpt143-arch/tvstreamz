import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, MailOpen, CheckCircle, Trash2, Loader2, User, Clock, Tv } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export const MessageManager = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Hindi ma-load ang mga messages.", variant: "destructive" });
    } else {
      setRequests(data || []);
    }
    setIsLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('user_requests')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast({ title: "Error", description: "Hindi ma-update ang status.", variant: "destructive" });
    } else {
      setRequests(prev => prev.map(req => req.id === id ? { ...req, status: newStatus } : req));
      toast({ title: "Updated", description: `Message marked as ${newStatus}.` });
    }
  };

  const deleteRequest = async (id: string) => {
    if (!window.confirm('Sigurado ka bang gusto mong burahin ang message na ito?')) return;
    
    const { error } = await supabase.from('user_requests').delete().eq('id', id);
    if (error) {
      toast({ title: "Error", description: "Hindi ma-delete ang message.", variant: "destructive" });
    } else {
      setRequests(prev => prev.filter(req => req.id !== id));
      toast({ title: "Deleted", description: "Message removed." });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-primary" /> User Requests & Reports
        </h2>
        <Button onClick={fetchRequests} variant="outline" size="sm">Refresh</Button>
      </div>

      <ScrollArea className="h-[600px] border border-border rounded-xl p-4 bg-card/50">
        {requests.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Wala pang bagong messages.</div>
        ) : (
          <div className="space-y-4 pr-4">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className={`p-4 rounded-xl border transition-all ${
                  req.status === 'unread' ? 'border-primary/50 bg-primary/5 shadow-sm' : 
                  req.status === 'resolved' ? 'border-green-500/30 bg-green-500/5 opacity-70' : 
                  'border-border bg-card'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="w-3.5 h-3.5" /> {req.username} ({req.email})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {new Date(req.created_at).toLocaleString('en-PH')}
                      </span>
                      {req.channel_id && (
                        <span className="flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded">
                          <Tv className="w-3.5 h-3.5" /> {req.channel_id}
                        </span>
                      )}
                    </div>
                    
                    <p className={`text-sm ${req.status === 'unread' ? 'font-semibold' : ''} break-words whitespace-pre-wrap`}>
                      {req.message}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:flex-col justify-end">
                    {req.status === 'unread' && (
                      <Button size="sm" variant="secondary" onClick={() => updateStatus(req.id, 'read')} className="gap-2 h-8">
                        <MailOpen className="w-3.5 h-3.5" /> Mark Read
                      </Button>
                    )}
                    {req.status !== 'resolved' && (
                      <Button size="sm" variant="outline" className="gap-2 h-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => updateStatus(req.id, 'resolved')}>
                        <CheckCircle className="w-3.5 h-3.5" /> Resolved
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteRequest(req.id)} className="gap-2 h-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
