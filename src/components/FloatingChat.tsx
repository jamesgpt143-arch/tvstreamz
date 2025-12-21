import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MessageCircle, X, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from './EmojiPicker';

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

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const channelId = 'global-chat';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    setProfile(data);
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('live_chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
      
      if (data) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`floating-chat-${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `channel_id=eq.${channelId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleQuickSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username is required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Generate random email and password for seamless auth
    const randomId = Math.random().toString(36).substring(2, 15);
    const fakeEmail = `${randomId}@livechat.local`;
    const fakePassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Store credentials in localStorage for auto-login
    localStorage.setItem('chat_credentials', JSON.stringify({ email: fakeEmail, password: fakePassword }));

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: fakeEmail,
      password: fakePassword,
    });

    if (authError) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          username: username.trim(),
          avatar_url: avatarUrl.trim() || null
        });

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to create profile",
          variant: "destructive"
        });
      } else {
        setShowSetup(false);
        toast({
          title: "Success",
          description: "You can now chat!"
        });
      }
    }

    setIsLoading(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !user || !profile) return;

    setIsLoading(true);

    const { error } = await supabase
      .from('live_chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        message: newMessage.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } else {
      setNewMessage('');
    }

    setIsLoading(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  const handleChatClick = () => {
    if (!user || !profile) {
      setShowSetup(true);
    }
    setIsOpen(true);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleChatClick}
        className="fixed bottom-6 right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
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

          {/* Setup Form */}
          {showSetup && !profile ? (
            <form onSubmit={handleQuickSignup} className="p-4 space-y-4">
              <div className="text-center mb-4">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter your username to start chatting
                </p>
              </div>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username *"
                maxLength={30}
                required
              />
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Avatar URL (optional)"
                type="url"
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Start Chatting'}
              </Button>
            </form>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 h-80 p-3" ref={scrollRef}>
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start the conversation!
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex gap-2">
                        <Avatar className="w-8 h-8 flex-shrink-0">
                          <AvatarImage src={msg.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(msg.username)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs">
                            <span className="font-medium text-primary">{msg.username}</span>
                            <span className="text-muted-foreground ml-2 text-[10px]">
                              {new Date(msg.created_at).toLocaleTimeString('en-PH', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </span>
                          </p>
                          <p className="text-sm break-words">{msg.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              {profile ? (
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
                <div className="p-3 border-t border-border">
                  <Button onClick={() => setShowSetup(true)} className="w-full">
                    Set up profile to chat
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};
