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
const SANDBOX_COMPATIBLE_SERVERS = ['Server 3', 'Server 6'];

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
    <div className="space-y-4">
      {/* Top Header: Server Selection & Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-secondary/10 p-2 md:p-3 rounded-xl border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-zinc-400 whitespace-nowrap uppercase tracking-widest pl-1">
          <Server className="w-3.5 h-3.5" />
          <span>Server</span>
        </div>
        
        <Select value={activeServer} onValueChange={handleServerChange}>
          <SelectTrigger className="w-[140px] md:w-[180px] h-9 bg-white/5 border-white/10 hover:bg-white/10 transition-colors rounded-lg">
            <SelectValue placeholder="Choose a server" />
          </SelectTrigger>
          <SelectContent>
            {serverEntries.map(([name]) => (
              <SelectItem key={name} value={name}>
                <div className="flex items-center justify-between w-full gap-4">
                  <span className="font-medium">{name}</span>
                  {SANDBOX_COMPATIBLE_SERVERS.includes(name) && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      Ad-Free
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <ShareButton title={title} iconOnly={true} />
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-9 h-9 bg-white/5 hover:bg-white/10 border-white/10 transition-all text-zinc-400 hover:text-white"
            onClick={handleFullscreen}
            title="Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Frame */}
      <div ref={containerRef} className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/5 relative group shadow-2xl ring-1 ring-white/10">
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
