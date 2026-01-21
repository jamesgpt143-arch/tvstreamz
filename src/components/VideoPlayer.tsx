import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Server, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

// Server 1 (VidSrc) supports sandbox, others don't
const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];
const PENDING_VIDEO_PLAY_KEY = 'pending_video_play';
const TOKEN_EXPIRY_MINUTES = 10;
const CUTY_IO_URL = 'https://cuty.io/LdrbJEQiJ';

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  // Check for verified return from cuty.io
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const isVerified = params.get('verified') === 'true';
    
    if (isVerified) {
      const pendingPlayData = localStorage.getItem(PENDING_VIDEO_PLAY_KEY);
      
      if (pendingPlayData) {
        try {
          const pendingPlay = JSON.parse(pendingPlayData);
          const tokenAge = (Date.now() - pendingPlay.timestamp) / 1000 / 60; // in minutes
          
          // Check if token is still valid (within 10 minutes)
          if (tokenAge <= TOKEN_EXPIRY_MINUTES && pendingPlay.server === 'Server 1') {
            // Auto-play the video
            setActiveServer('Server 1');
            setIsPlaying(true);
            
            // Clear pending play data
            localStorage.removeItem(PENDING_VIDEO_PLAY_KEY);
          }
        } catch (e) {
          console.error('Error parsing pending play data:', e);
        }
      }
      
      // Clean up URL by removing verified parameter
      params.delete('verified');
      const newSearch = params.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      navigate(newUrl, { replace: true });
    }
  }, [location.search, navigate, location.pathname]);

  // Clear pending play when switching servers
  useEffect(() => {
    if (activeServer !== 'Server 1') {
      localStorage.removeItem(PENDING_VIDEO_PLAY_KEY);
    }
  }, [activeServer]);

  const handlePlay = () => {
    if (activeServer === 'Server 1') {
      // Store pending play info for Server 1
      const pendingPlay = {
        server: 'Server 1',
        timestamp: Date.now()
      };
      localStorage.setItem(PENDING_VIDEO_PLAY_KEY, JSON.stringify(pendingPlay));
      
      // Redirect to cuty.io
      window.location.href = CUTY_IO_URL;
      return;
    }
    
    // For other servers, open Shopee link and play
    window.open('https://s.shopee.ph/9pY6GawaMi', '_blank');
    setIsPlaying(true);
  };

  return (
    <div className="space-y-4">
      {/* Server Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <Server className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground mr-2">Select Server:</span>
        {serverEntries.map(([name]) => (
          <Button
            key={name}
            variant={activeServer === name ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setActiveServer(name);
              setIsPlaying(false); // Reset play state when switching servers
            }}
            className="gap-2"
          >
            {name}
            {SANDBOX_COMPATIBLE_SERVERS.includes(name) && (
              <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">No Ads</span>
            )}
          </Button>
        ))}
      </div>

      {/* Video Frame */}
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-card border border-border relative">
        {!isPlaying ? (
          // Play button overlay
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/60 cursor-pointer z-10"
            onClick={handlePlay}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors hover:scale-105 transform">
                <Play className="w-10 h-10 text-primary-foreground ml-1" fill="currentColor" />
              </div>
              <span className="text-white font-medium">Click to Play</span>
            </div>
          </div>
        ) : null}

        {isPlaying && (
          useSandbox ? (
            <iframe
              key={`sandboxed-${activeServer}`}
              src={currentUrl}
              title={title}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              referrerPolicy="origin"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          ) : (
            <iframe
              key={`normal-${activeServer}`}
              src={currentUrl}
              title={title}
              className="w-full h-full"
              allowFullScreen
              allow="autoplay; encrypted-media; picture-in-picture"
              referrerPolicy="origin"
            />
          )
        )}
      </div>

      {/* Share Button */}
      <div className="flex justify-start">
        <ShareButton title={title} />
      </div>
    </div>
  );
};
