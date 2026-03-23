import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, X, Send, Loader2, LogIn, MessageSquareQuote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
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
        message: message.trim(),
        status: 'unread'
      });

      if (error) throw error;

      setIsSent(true);
      setMessage('');
      toast({ title: "Message Sent!", description: "Naipadala na ang iyong mensahe sa admin." });
      setTimeout(() => {
        setIsOpen(false);
        setIsSent(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Hindi maipadala ang mensahe. Subukan muli.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={handleChatClick}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-3 md:p-4 shadow-lg transition-all duration-200 hover:scale-105"
      >
        <Mail className="w-5 h-5 md:w-6 md:h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-50 w-[calc(100%-2rem)] sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span className="font-semibold">Contact Admin</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:opacity-75">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 flex-1">
            {isSent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
                  <Send className="w-6 h-6 ml-1" />
                </div>
