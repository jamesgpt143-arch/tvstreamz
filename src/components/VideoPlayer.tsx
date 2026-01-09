import { useState, useRef } from 'react';
import { Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImmersiveFullscreen } from '@/hooks/useImmersiveFullscreen';

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

  const { isFullscreen } = useImmersiveFullscreen({ containerRef });

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

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
        className={`aspect-video w-full rounded-xl overflow-hidden bg-card border border-border ${
          isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none aspect-auto' : ''
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
