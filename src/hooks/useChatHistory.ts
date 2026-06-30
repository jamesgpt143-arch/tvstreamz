import { useState, useEffect, useCallback } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    name: string;
    content: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export function useChatHistory(storageKey: string, initialMessage: string) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatSession[];
        setSessions(parsed);
        if (parsed.length > 0) {
          // Sort by latest updated
          parsed.sort((a, b) => b.updatedAt - a.updatedAt);
          setActiveSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Save to localStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    }
  }, [sessions, storageKey]);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [{ role: 'assistant', content: initialMessage }],
      updatedAt: Date.now(),
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  }, [initialMessage]);

  const updateActiveSession = useCallback((newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(session => {
      if (session.id === activeSessionId) {
        // Auto-generate title from the first user message if title is "New Chat"
        let title = session.title;
        if (title === 'New Chat') {
          const firstUserMsg = newMessages.find(m => m.role === 'user');
          if (firstUserMsg) {
            title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return {
          ...session,
          title,
          messages: newMessages,
          updatedAt: Date.now()
        };
      }
      return session;
    }).sort((a, b) => b.updatedAt - a.updatedAt));
  }, [activeSessionId]);

  const deleteSession = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        // If last session deleted, create a new one immediately
        setTimeout(() => createNewSession(), 0);
      } else if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  }, [activeSessionId, createNewSession]);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createNewSession,
    updateActiveSession,
    deleteSession,
  };
}
