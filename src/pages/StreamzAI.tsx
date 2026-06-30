import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function StreamzAI() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('streamz_ai_history');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [{ role: 'assistant', content: 'Hello! I am Streamz AI, your personal streaming assistant. How can I help you today?' }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    localStorage.setItem('streamz_ai_history', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    
    setInput('');
    setIsLoading(true);

    const newMessage: Message = { role: 'user', content: userMessage };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);

    try {
      const payloadMessages = newMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payloadMessages })
      });

      const data = await response.json();

      if (response.ok && data.content && data.content.length > 0) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content[0].text }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong or I encountered an error. Please check the API configuration.' }]);
        console.error('Chat API Error:', data);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I am having trouble connecting to the server right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your chat history?')) {
      const initialMessage: Message[] = [{ role: 'assistant', content: 'Hello! I am Streamz AI, your personal streaming assistant. How can I help you today?' }];
      setMessages(initialMessage);
      localStorage.setItem('streamz_ai_history', JSON.stringify(initialMessage));
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen max-h-screen bg-background overflow-hidden relative pb-16 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-border/50 bg-card/30 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Streamz AI</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Powered by Google Gemma
              <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ml-1">Beta</span>
            </p>
          </div>
        </div>
        {messages.length > 1 && (
          <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs text-muted-foreground hover:text-foreground">
            Clear History
          </Button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-3.5 ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-md' 
                : 'bg-card border border-border/50 rounded-tl-sm shadow-sm'
            }`}>
              {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1 border border-primary/20">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 lg:p-6 bg-background/80 backdrop-blur-md border-t border-border/50 shrink-0">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative max-w-4xl mx-auto flex flex-col gap-2"
        >
          <div className="relative flex items-center gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about movies, shows, or anything..."
              className="h-12 lg:h-14 px-5 rounded-full bg-card/50 border-white/10 focus-visible:ring-primary shadow-inner text-base flex-1"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 lg:h-14 lg:w-14 shrink-0 rounded-full transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
            </Button>
          </div>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-3">
          AI generated content may be inaccurate.
        </p>
      </div>
    </div>
  );
}
