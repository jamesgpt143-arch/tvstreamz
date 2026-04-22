import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Send, Loader2, LogIn, MessageSquareQuote } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface LiveChatProps {
  channelId: string;
}

export const LiveChat = ({ channelId }: LiveChatProps) => {
  const [message, setMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    setProfile(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setIsLoading(true);

    try {
      const { error } = await supabase.from('user_requests').insert({
        user_id: user.id,
        email: user.email,
        username: profile?.username || 'Unknown User',
        channel_id: channelId,
        message: message.trim(),
        status: 'unread'
      });

      if (error) throw error;

      setIsSent(true);
      setMessage('');
      toast({ title: "Message Sent!", description: "Naipadala na ang iyong mensahe." });
      setTimeout(() => setIsSent(false), 5000);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Hindi maipadala ang mensahe. Subukan muli.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 h-[400px] flex flex-col items-center justify-center gap-4">
        <MessageSquareQuote className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center text-sm">
          Login para makapag-send ng message sa admin.
        </p>
        <Button asChild className="gap-2">
          <Link to="/auth"><LogIn className="w-4 h-4" />Login / Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-[400px]">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Contact Admin</span>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center">
        {isSent ? (
          <div className="flex flex-col items-center justify-center text-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Send className="w-8 h-8 ml-1" />
            </div>
            <h3 className="font-bold text-xl">Message Sent!</h3>
            <p className="text-sm text-muted-foreground">
              Naipadala na namin ang iyong mensahe sa Admin. Babasahin namin ito sa lalong madaling panahon. Salamat!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4 h-full">
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg text-center">
              May gusto ka bang i-request na channel, pelikula, o i-report na sirang link?
            </div>
            
            <div className="space-y-1.5 mt-2">
              <label className="text-xs font-medium text-muted-foreground">Manggagaling sa:</label>
              <Input value={user.email} disabled className="bg-muted/50 text-xs h-9" />
            </div>

            <div className="space-y-1.5 flex-1 flex flex-col">
              <label className="text-xs font-medium text-muted-foreground">Ang iyong mensahe:</label>
              <Textarea 
                placeholder="I-type ang iyong mensahe dito..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 text-sm resize-none"
                required
              />
            </div>

            <Button type="submit" disabled={isLoading || !message.trim()} className="w-full h-10 mt-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isLoading ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
