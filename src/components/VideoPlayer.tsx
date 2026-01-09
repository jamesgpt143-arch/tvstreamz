import { useState, useRef, useEffect } from 'react';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBar, Style } from '@capacitor/status-bar';
import { ScreenOrientation } from '@capacitor/screen-orientation';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  useEffect(() => {
    // 1. Function para mag-setup ng Status Bar base sa position ng phone
    const handleOrientationChange = async () => {
      const orientation = await ScreenOrientation.orientation();
      
      if (orientation.type.includes('landscape')) {
        // KAPAG LANDSCAPE (Nanonood):
        setIsFullscreen(true);
        // Itago ang status bar at sagad sa notch
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.hide();
      } else {
        // KAPAG PORTRAIT (Bumalik):
        setIsFullscreen(false);
        // Ipakita ang status bar
        await StatusBar.show();
        // Ibalik sa Puti at Itim na text
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        // I-off ang overlay
        await StatusBar.setOverlaysWebView({ overlay: false });
      }
    };

    // 2. Add Listener: Makikinig ang app kung iikutin mo ang phone o pipindutin ang fullscreen sa player
    ScreenOrientation.addListener('screenOrientationChange', handleOrientationChange);

    // Initial check (kung sakaling naka-landscape agad pagpasok)
    handleOrientationChange();

    // Cleanup: Tanggalin ang listener pag umalis sa page
    return () => {
      ScreenOrientation.removeAllListeners();
      // Siguraduhing babalik sa normal pag-alis
      StatusBar.show();
      StatusBar.setOverlaysWebView({ overlay: false });
      ScreenOrientation.lock({ orientation: 'portrait' });
    };
  }, []);

  return (
    <div className="space-y-4">
      
      {/* NOTE: Nandito pa rin ang Server Buttons. 
          Kung gusto mo talagang tanggalin, burahin mo itong buong <div> ng Server Selection.
          Pero highly recommended na iwan ito para makapili ka ng source.
      */}
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
