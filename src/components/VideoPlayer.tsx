import { useState, useRef, useEffect } from 'react';
import { Server, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

// Server 1 (VidSrc) supports sandbox, others don't
const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];

// Helper to hide/show status bar on native platforms
const setImmersiveMode = async (enabled: boolean) => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (enabled) {
        await StatusBar.hide();
      } else {
        await StatusBar.show();
      }
    } catch (e) {
      // Status bar plugin not available or failed
    }
  }
};

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setIsFullscreen(inFullscreen);
      
      // Try to lock orientation to landscape when entering fullscreen
      const orientation = screen.orientation as any;
      if (inFullscreen && orientation?.lock) {
        orientation.lock('landscape').catch(() => {});
      }
      
      // Enable/disable immersive mode (hide status bar on Android)
      setImmersiveMode(inFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    const orientation = screen.orientation as any;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        // Try to lock to landscape
        if (orientation?.lock) {
          await orientation.lock('landscape').catch(() => {});
        }
        // Hide status bar for immersive experience
        await setImmersiveMode(true);
      } else {
        await document.exitFullscreen();
        // Unlock orientation when exiting
        if (orientation?.unlock) {
          orientation.unlock();
        }
        // Show status bar again
        await setImmersiveMode(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
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
            onClick={() => setActiveServer(name)}
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
      <div 
        ref={containerRef}
        className={`relative w-full rounded-xl overflow-hidden bg-card border border-border ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'aspect-video'
        }`}
      >
        {useSandbox ? (
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
        )}

        {/* Custom Fullscreen Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          className="absolute bottom-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};