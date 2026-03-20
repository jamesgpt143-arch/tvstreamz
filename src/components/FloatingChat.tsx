import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, X, Trash2, ShieldCheck, LogIn, Loader2, LockOpen, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from './EmojiPicker';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  channel_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  message: string;
  created_at: string;
  is_admin?: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
}

const ADMIN_AVATAR = 'https://api.dicebear.com/7.x/bottts/svg?seed=admin&backgroundColor=0ea5e9';

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cuty Ads States
  const [isChatUnlocked, setIsChatUnlocked] = useState(false);
  const [unlockLink, setUnlockLink] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const channelId = 'global-chat';

  // Auth & Admin Check
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

  // Cuty Unlocking Logic
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('chat_unlocked') === 'true') {
      const unlockTime = new Date().getTime();
      localStorage.setItem('chat_unlock_time', unlockTime.toString());
      setIsChatUnlocked(true);
      setIsOpen(true); // Auto-open pagbalik galing ads
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
    if (!isOpen) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (data) {
        setMessages(data.reverse());
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`floating-chat-${channelId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'live_chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as ChatMessage])
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'live_chat_messages', filter: `channel_id=eq.${channelId}` },
        (payload) => setMessages((prev) => prev.filter(msg => msg.id !== (payload.old as any).id))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    if (isAdmin && newMessage.trim() === '/clear_all') {
      setIsLoading(true);
      const { error } = await supabase.from('live_chat_messages').delete().eq('channel_id', channelId);
      if (error) {
        toast({ title: "Error", description: "Failed to clear chat", variant: "destructive" });
      } else {
        setMessages([]); 
        toast({ title: "Chat Cleared", description: "All messages have been deleted." });
      }
      setNewMessage(''); 
      setIsLoading(false);
      return; 
    }
    
    const displayUsername = isAdmin ? 'Admin' : profile?.username;
    const displayAvatar = isAdmin ? ADMIN_AVATAR : profile?.avatar_url;
    
    if (!displayUsername) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        username: displayUsername,
        avatar_url: displayAvatar,
        message: newMessage.trim()
      });

    if (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } else {
      setNewMessage('');
    }
    setIsLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();
  const handleChatClick = () => setIsOpen(!isOpen);
  const isAdminMessage = (username: string) => username === 'Admin';

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase.from('live_chat_messages').delete().eq('id', messageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete message", variant: "destructive" });
    } else {
      setMessages((prev) => prev.filter(msg => msg.id !== messageId));
      toast({ title: "Deleted", description: "Message removed" });
    }
  };

  return (
    <>
      <button
        onClick={handleChatClick}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 md:p-4 shadow-lg transition-all duration-200 hover:scale-105"
      >
        <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 max-w-96 max-h-[60vh] md:max-h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">Live Chat</span>
              <span className="text-xs opacity-75">({messages.length})</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div 
            ref={scrollRef}
            className="flex-1 min-h-0 overflow-y-scroll p-3"
            style={{ maxHeight: 'calc(60vh - 140px)' }}
          >
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="flex gap-2 group">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.avatar_url || undefined} />
                      <AvatarFallback className={`text-xs ${isAdminMessage(msg.username) ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                        {isAdminMessage(msg.username) ? <ShieldCheck className="w-4 h-4" /> : getInitials(msg.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs flex items-center gap-1">
                        {isAdminMessage(msg.username) && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                        <span className={`font-medium ${isAdminMessage(msg.username) ? 'text-primary font-bold' : 'text-primary'}`}>
                          {msg.username}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(msg.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAdmin && (
                          <button onClick={() => handleDeleteMessage(msg.id)} className="ml-auto p-1 hover:bg-destructive/10 rounded opacity-60 hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </p>
                      <p className="text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {user ? (
            profile || isAdmin ? (
              // DITO PUMAPASOK ANG CUTY ADS LOGIC
              isChatUnlocked || isAdmin ? (
                <form onSubmit={handleSendMessage} className="p-3 border-t border-border flex items-center gap-2">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="text-sm flex-1"
                    maxLength={500}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !newMessage.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              ) : (
                <div className="p-4 border-t border-border flex flex-col items-center gap-3 text-center bg-muted/10">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <LockOpen className="w-4 h-4 text-primary" /> Chat is Locked
                  </h3>
                  <p className="text-xs text-muted-foreground mb-1 px-2">
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
              )
            ) : (
              <div className="p-3 border-t border-border flex flex-col items-center gap-2 text-center">
                <p className="text-sm text-muted-foreground">Please complete your profile to chat.</p>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/auth?setup=true">Set Up Profile</Link>
                </Button>
              </div>
            )
          ) : (
            <div className="p-3 border-t border-border flex flex-col items-center gap-2 text-center bg-muted/30">
              <p className="text-sm font-medium">Join the conversation!</p>
              <p className="text-xs text-muted-foreground mb-1">Create a free account to send messages.</p>
              <Button asChild className="w-full gap-2">
                <Link to="/auth">
                  <LogIn className="w-4 h-4" />
                  Log In / Sign Up
                </Link>
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
};
