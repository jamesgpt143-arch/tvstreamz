import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageCircle, 
  X, 
  Send, 
  Loader2, 
  LogIn, 
  CornerDownRight, 
  MessageSquare,
  Reply
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user_id: string;
  username: string;
  message: string;
  parent_id: string | null;
  reply_to_username: string | null;
  created_at: string;
}

export const CommunityChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkChatSettings();
    getCurrentUser();
    fetchMessages();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('community_chat_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'community_messages' },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkChatSettings = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'chat_settings')
      .maybeSingle();
    
    if (data?.value) {
      setIsEnabled((data.value as any).enabled !== false);
    }
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    // Fetch only last 14 days
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const { data, error } = await supabase
      .from('community_messages' as any)
      .select('*')
      .gt('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    }
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      // Get profile for username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();
      
      const username = profile?.username || user.email.split('@')[0];

      const { error } = await supabase.from('community_messages' as any).insert({
        user_id: user.id,
        username,
        message: newMessage.trim(),
        parent_id: replyingTo?.id || null,
        reply_to_username: replyingTo?.username || null
      });

      if (error) throw error;

      setNewMessage('');
      setReplyingTo(null);
    } catch (error: any) {
      toast.error('Galing! Hindi maipadala ang mensahe.');
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[60]">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-2xl transition-all hover:scale-110 flex items-center justify-center group relative"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse"></span>
          <span className="absolute right-full mr-3 bg-card border border-border px-3 py-1.5 rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
            Community Chat
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl w-[calc(100vw-2rem)] sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 border-b border-border bg-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/20 text-primary">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Community Chat</h3>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Live Community
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                <MessageCircle className="w-12 h-12 mb-3" />
                <p className="text-sm font-medium">Wala pang usapan dito.</p>
                <p className="text-xs">Maging una sa pag-message!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col gap-1",
                      msg.user_id === user?.id ? "items-end" : "items-start"
                    )}
                  >
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {msg.username}
                      </span>
                      <span className="text-[9px] text-muted-foreground/50">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="group relative max-w-[85%]">
                      {msg.reply_to_username && (
                        <div className="text-[9px] mb-1 flex items-center gap-1 text-primary opacity-70 italic">
                          <CornerDownRight className="w-3 h-3" />
                          Replying to @{msg.reply_to_username}
                        </div>
                      )}
                      <div 
                        className={cn(
                          "p-3 rounded-2xl text-sm shadow-sm",
                          msg.user_id === user?.id 
                            ? "bg-primary text-primary-foreground rounded-tr-none" 
                            : "bg-muted border border-border rounded-tl-none"
                        )}
                      >
                        {msg.message}
                      </div>

                      {user && msg.user_id !== user.id && (
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="absolute top-0 -right-8 p-1 opacity-0 group-hover:opacity-100 hover:text-primary transition-all bg-card border border-border rounded-full shadow-lg"
                        >
                          <Reply className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-muted/30">
            {!user ? (
              <div className="text-center p-2 bg-primary/10 rounded-xl border border-primary/20">
                <p className="text-xs font-bold mb-2">Login para makasali sa usapan</p>
                <Button asChild size="sm" className="w-full gap-2 text-xs h-8">
                  <Link to="/auth"><LogIn className="w-3 h-3" /> Sign In</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="space-y-2">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-primary/10 p-2 rounded-lg border border-primary/20 text-[10px] animate-in slide-in-from-bottom-1">
                    <div className="flex items-center gap-1 text-primary font-bold">
                      <Reply className="w-3 h-3" /> Replying to @{replyingTo.username}
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setReplyingTo(null)}
                      className="hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    placeholder="Mag-type ng mensahe..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 bg-background border-border focus-visible:ring-primary h-10 text-sm rounded-xl px-4"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!newMessage.trim() || isSending}
                    className="shrink-0 h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                  >
                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
