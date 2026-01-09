import { useState, useRef, useEffect } from 'react';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

// Server 1 (VidSrc) supports sandbox, others don't
const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];

// Helper to check if device is in landscape orientation
const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

// Helper to hide/show status bar on native platforms - only hide in landscape fullscreen
const setImmersiveMode = async (enabled: boolean) => {
  if (Capacitor.isNativePlatform()) {
    try {
      if (enabled && isLandscape()) {
        await StatusBar.hide();
      } else {
        await StatusBar.show();
      }
    } catch (e) {
      // Status bar plugin not available or failed
    }
  }
};

// Auto fullscreen based on orientation
const handleAutoFullscreen = async (containerRef: React.RefObject<HTMLDivElement>) => {
  if (!containerRef.current) return;
  
  const inFullscreen = !!document.fullscreenElement;
  const landscape = isLandscape();
  
  try {
    if (landscape && !inFullscreen) {
      // Enter fullscreen when rotating to landscape
      await containerRef.current.requestFullscreen();
      await setImmersiveMode(true);
    } else if (!landscape && inFullscreen) {
      // Exit fullscreen when rotating to portrait
      await document.exitFullscreen();
      await setImmersiveMode(false);
    }
  } catch (err) {
    // Fullscreen not supported or failed
  }
};

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const containerRef = useRef<HTMLDivElement>(null);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  // Handle orientation changes for auto fullscreen (native apps only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleOrientationChange = () => {
      handleAutoFullscreen(containerRef);
    };

    const handleFullscreenChange = () => {
      const inFullscreen = !!document.fullscreenElement;
      setImmersiveMode(inFullscreen);
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

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
        className="relative w-full rounded-xl overflow-hidden bg-card border border-border aspect-video"
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
      </div>
    </div>
  );
};
