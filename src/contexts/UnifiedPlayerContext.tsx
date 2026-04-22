import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Channel } from '@/lib/channels';
import type { Movie } from '@/lib/tmdb';

export type MediaType = 'live' | 'movie' | 'tv';

export interface MediaSource {
  type: MediaType;
  id: string | number;
  data: Channel | Movie | any;
  meta?: {
    season?: number;
    episode?: number;
    server?: string;
  };
}

interface UnifiedPlayerContextType {
  activeMedia: MediaSource | null;
  setActiveMedia: (media: MediaSource | null) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

const UnifiedPlayerContext = createContext<UnifiedPlayerContextType | undefined>(undefined);

export const UnifiedPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [activeMedia, setActiveMedia] = useState<MediaSource | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <UnifiedPlayerContext.Provider value={{ activeMedia, setActiveMedia, isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </UnifiedPlayerContext.Provider>
  );
};

export const useUnifiedPlayer = () => {
  const context = useContext(UnifiedPlayerContext);
  if (context === undefined) {
    throw new Error('useUnifiedPlayer must be used within a UnifiedPlayerProvider');
  }
  return context;
};
