import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, LogIn, Loader2, LockOpen, ExternalLink, Reply, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

interface LiveChatProps {
  channelId: string;
}

export const LiveChat = ({ channelId }: LiveChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState<{username: string, message: string} | null>(null);

  // Cuty Ads States
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [unlockLink, setUnlockLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    setProfile(data);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('chat_unlocked') === 'true') {
      const unlockTime = new Date().getTime();
      localStorage.setItem('chat_unlock_time', unlockTime.toString());
      setIsChatUnlocked(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      const savedTime = localStorage.getItem('chat_unlock_time');
      if (savedTime) {
        const threeHours = 3 * 60 * 60 * 1000;
        if (new Date().getTime() - parseInt(savedTime) < threeHours) {
          setIsChatUnlocked(true);
        } else {
          localStorage.removeItem('chat_unlock_time');
        }
      }
    }
  }, []);

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    try {
      const returnUrl = window.location.origin + window.location.pathname + '?chat_unlocked=true';
      const { data, error } = await supabase.functions.invoke('cuty-shorten', {
        body: { destinationUrl: returnUrl }
      });

      if (error) throw error;
      if (data?.shortUrl) {
        setUnlockLink(data.shortUrl);
      }
    } catch (err) {
      console.error("Error generating link:", err);
      toast({ title: "Error", description: "Failed to generate ad link.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel(`live-chat-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [channelId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !profile) return;

    let finalMessage = newMessage.trim();

    // Format if replying
    if (replyingTo) {
      finalMessage = `@@REPLY||${replyingTo.username}||${replyingTo.message}||${finalMessage}`;
    }

    setIsLoading(true);
    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        message: finalMessage
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage('');
      setReplyingTo(null); // Clear reply state after sending
    }
    setIsLoading(false);
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  // Helper to extract clean text
  const getCleanMessage = (raw: string) => {
    if (raw.startsWith('@@REPLY||')) {
        const parts = raw.split('||');
        if (parts.length >= 4) return parts.slice(3).join('||');
    }
    return raw;
  };

  // Render logic for Quoted Messages
  const renderMessage = (rawMessage: string) => {
    if (rawMessage.startsWith('@@REPLY||')) {
       const parts = rawMessage.split('||');
       if (parts.length >= 4) {
          const rUser = parts[1];
          const rQuote = parts[2];
          const text = parts.slice(3).join('||');
          return (
             <div className="flex flex-col gap-1 w-full mt-1">
                <div className="bg-primary/10 border-l-2 border-primary px-2 py-1 rounded-r-md text-[11px] text-muted-foreground opacity-90">
                   <span className="font-semibold text-primary mr-1">{rUser}:</span>
                   <span className="line-clamp-1 italic">"{rQuote}"</span>
                </div>
                <span>{text}</span>
             </div>
          );
       }
    }
    return <span>{rawMessage}</span>;
  };

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 h-[400px] flex flex-col items-center justify-center gap-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center text-sm">Login para makasali sa live chat</p>
        <Button asChild className="gap-2">
          <Link to="/auth"><LogIn className="w-4 h-4" />Login / Sign Up</Link>
        </Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 h-[400px] flex flex-col items-center justify-center gap-4">
        <MessageCircle className="w-12 h-12 text-muted-foreground" />
        <p className="text-muted-foreground text-center text-sm">Set up your profile first</p>
        <Button asChild className="gap-2"><Link to="/auth?setup=true">Setup Profile</Link></Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl flex flex-col h-[400px]">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Live Chat</span>
        <span className="text-xs text-muted-foreground">({messages.length})</span>
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="space-y-3">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Wala pang messages. Ikaw na mag-start!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex gap-2 group">
                <Avatar className="w-7 h-7 flex-shrink-0 mt-1">
                  <AvatarImage src={msg.avatar_url || undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {getInitials(msg.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-xs flex items-center gap-1">
                    <span className="font-medium text-primary">{msg.username}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {/* Reply Button (Lumalabas pag naka-hover) */}
                    <button 
                      onClick={() => setReplyingTo({username: msg.username, message: getCleanMessage(msg.message)})} 
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-primary/10 rounded"
                      title="Reply to this message"
                    >
                      <Reply className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </button>
                  </div>
                  <div className="text-sm break-words mt-0.5">{renderMessage(msg.message)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {isChatUnlocked || isAdmin ? (
        <div className="flex flex-col border-t border-border">
          {/* Quoting Banner */}
          {replyingTo && (
            <div className="bg-primary/5 px-3 py-2 flex items-center justify-between text-xs border-b border-border/50 relative">
              <div className="flex flex-col min-w-0 flex-1 border-l-2 border-primary pl-2">
                <span className="font-semibold text-primary">Replying to {replyingTo.username}</span>
                <span className="text-muted-foreground truncate italic">"{replyingTo.message}"</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-background rounded-full ml-2 text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="p-3 flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
              className="text-sm h-9"
              maxLength={500}
            />
            <Button type="submit" size="sm" disabled={isLoading || !newMessage.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="p-4 border-t border-border flex flex-col items-center gap-2 text-center bg-muted/10">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <LockOpen className="w-4 h-4 text-primary" /> Chat is Locked
          </h3>
          <p className="text-xs text-muted-foreground mb-1">
            Manood ng mabilis na ad para makapag-chat sa loob ng 3 oras. Mapipigilan nito ang mga spammers!
          </p>
          {!unlockLink ? (
            <Button onClick={handleGenerateLink} disabled={isGenerating} size="sm" className="w-full">
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isGenerating ? "Generating link..." : "Unlock Chat"}
            </Button>
          ) : (
            <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
              <a href={unlockLink} target="_self">
                Proceed to Ad <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
