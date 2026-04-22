import { useState, useEffect, useRef } from 'react';
import { Server, Maximize2 } from 'lucide-react';
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

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
  initialServer?: string;
  onServerChange?: (server: string) => void;
}

// Ang Server 3 (vidsrc.cc) ang ating "No Ads" option dahil ito ay stable sa sandbox
const SANDBOX_COMPATIBLE_SERVERS = ['Server 3'];

export const VideoPlayer = ({ servers, title, initialServer, onServerChange }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(initialServer || serverEntries[0]?.[0] || '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialServer && servers[initialServer]) {
      setActiveServer(initialServer);
    }
  }, [initialServer, servers]);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  // Palaging considered "isPlaying" dahil tinanggal na natin ang initial overlay
  const isPlaying = true;

  useEffect(() => {
    return setupOrientationFullscreen(containerRef.current, isPlaying);
  }, [isPlaying]);

  const handleServerChange = (value: string) => {
    setActiveServer(value);
    onServerChange?.(value);
  };

  const handleFullscreen = () => {
    enterFullscreen(containerRef.current);
  };

  return (
    <div className="w-full h-full flex flex-col bg-black">
      {/* Subtle Floating Server Selector */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2 opacity-20 hover:opacity-100 transition-opacity duration-500">
        <Select value={activeServer} onValueChange={handleServerChange}>
          <SelectTrigger className="w-[120px] h-8 bg-black/40 backdrop-blur-xl border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-black/90 border-white/10">
            {serverEntries.map(([name]) => (
              <SelectItem key={name} value={name} className="text-[10px] font-black uppercase tracking-widest">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-xl border border-white/10 text-zinc-400"
          onClick={handleFullscreen}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Video Frame */}
      <div ref={containerRef} className="flex-1 w-full bg-black relative">
        {useSandbox ? (
          <iframe
            key={`sandboxed-${activeServer}`}
            src={currentUrl}
            title={title}
            className="w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="origin"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
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
