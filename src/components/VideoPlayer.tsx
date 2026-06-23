import { useState, useEffect, useRef } from 'react';
import { Server, Maximize2, AlertTriangle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareButton } from '@/components/ShareButton';
import { setupOrientationFullscreen, enterFullscreen } from '@/lib/capacitorFullscreen';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
  initialServer?: string;
  onServerChange?: (server: string) => void;
}

const SANDBOX_COMPATIBLE_SERVERS = ['Server 3'];

export const VideoPlayer = ({ servers, title, initialServer, onServerChange }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  
  // Find initial server index
  const initIndex = initialServer ? serverEntries.findIndex(s => s[0] === initialServer) : 0;
  const [serverIndex, setServerIndex] = useState(initIndex >= 0 ? initIndex : 0);

  useEffect(() => {
    if (initialServer) {
      const newIdx = serverEntries.findIndex(s => s[0] === initialServer);
      if (newIdx >= 0) {
        setServerIndex(newIdx);
      }
    }
  }, [initialServer, servers]);
  const [iframeKey, setIframeKey] = useState(0); // To force iframe reload
  const [isFailed, setIsFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const activeServerName = serverEntries[serverIndex]?.[0] || '';
  const currentUrl = serverEntries[serverIndex]?.[1] || '';
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServerName);

  useEffect(() => {
    return setupOrientationFullscreen(containerRef.current, true);
  }, []);

  const handleServerChange = (value: string) => {
    const newIdx = serverEntries.findIndex(s => s[0] === value);
    if (newIdx >= 0) {
      setServerIndex(newIdx);
      onServerChange?.(value);
      setIframeKey(k => k + 1);
      setIsFailed(false);
    }
  };

  const handleFullscreen = () => {
    enterFullscreen(containerRef.current);
  };

  const autoSwitchNext = () => {
    if (serverIndex < serverEntries.length - 1) {
      toast.error(`${activeServerName} might be down. Switching to next server...`);
      const nextIdx = serverIndex + 1;
      setServerIndex(nextIdx);
      onServerChange?.(serverEntries[nextIdx][0]);
      setIframeKey(k => k + 1);
    } else {
      setIsFailed(true);
      toast.error("No working servers found. Please try again later.");
    }
  };

  return (
    <div ref={containerRef} className="w-full relative flex flex-col group rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black">
      
      {/* Player Header Overlay (visible on hover or always if not full screen?)
          Actually let's keep it visible at the top inside the container, or as a bar above.
          The user screenshot has "Now Playing", "Auto Next", "Sub/Dub" OUTSIDE the video frame.
          So inside VideoPlayer we only need the Server select and Fullscreen button. */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 focus-within:opacity-100">
        
        {/* Server Select has been moved to Player.tsx */}
        <div />

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs bg-red-500/20 hover:bg-red-500/40 border-red-500/30 text-red-100 backdrop-blur-md"
            onClick={autoSwitchNext}
            disabled={isFailed}
          >
            <AlertTriangle className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">{isFailed ? "Failed" : "Server Error?"}</span>
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="w-8 h-8 bg-black/50 hover:bg-black/80 border-white/10 text-white backdrop-blur-md"
            onClick={handleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Failover Message */}
      {isFailed && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Streaming Failed</h2>
          <p className="text-sm text-zinc-400 max-w-sm">
            We tried all {serverEntries.length} available servers, but none seem to be working right now. Please try again later.
          </p>
        </div>
      )}

      {/* Video Frame */}
      <div className="w-full aspect-video bg-black relative">
        {!isFailed && currentUrl && (
          <iframe
            key={`${activeServerName}-${iframeKey}`}
            src={currentUrl}
            title={title}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="origin"
            sandbox={useSandbox ? "allow-scripts allow-same-origin allow-presentation allow-forms" : undefined}
            onError={() => {
              console.warn(`[VideoPlayer] Iframe error on ${activeServerName}`);
              autoSwitchNext();
            }}
          />
        )}
      </div>
    </div>
  );
};
