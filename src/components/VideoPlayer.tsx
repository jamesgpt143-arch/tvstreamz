import { useState, useRef, useEffect } from 'react';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Tinanggal natin ang useImmersiveFullscreen hook at pinalitan ng direct imports
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

// Server 1 (VidSrc) supports sandbox, others don't
const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State para sa layout changes
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  // DITO ANG MAGIC: Logic para sa Status Bar at Rotation
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        setIsFullscreen(true);
        // 1. Payagan ang overlay (para sumagad sa notch)
        await StatusBar.setOverlaysWebView({ overlay: true });
        // 2. Itago ang status bar
        await StatusBar.hide();
        // 3. I-force Landscape
        await ScreenOrientation.lock({ orientation: 'landscape' });
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    };

    const exitFullscreen = async () => {
      try {
        setIsFullscreen(false);
        // 1. I-lock ulit sa Portrait
        await ScreenOrientation.lock({ orientation: 'portrait' });
        
        // 2. Ipakita ulit ang Status Bar
        await StatusBar.show();
        
        // 3. FORCE RESET: Siguraduhing Puti ang Background at Itim ang Text
        await StatusBar.setStyle({ style: Style.Dark }); 
        await StatusBar.setBackgroundColor({ color: '#ffffff' }); 
        
        // 4. I-off ang overlay para bumaba ang content (Safe area fix)
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    };

    // Trigger pag-mount (pagbukas ng player)
    enterFullscreen();

    // Trigger pag-unmount (pag-alis sa player/page)
    return () => {
      exitFullscreen();
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
        className={`w-full rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 ${
          isFullscreen 
            ? 'fixed inset-0 z-50 rounded-none border-none h-screen w-screen bg-black' 
            : 'aspect-video'
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
      </div>
    </div>
  );
};
