import { useState } from 'react';
import { Server, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareButton } from '@/components/ShareButton';

interface VideoPlayerProps {
  servers: Record<string, string>;
  title: string;
}

// Server 1 (VidSrc) supports sandbox, others don't
const SANDBOX_COMPATIBLE_SERVERS = ['Server 1'];

export const VideoPlayer = ({ servers, title }: VideoPlayerProps) => {
  const serverEntries = Object.entries(servers);
  const [activeServer, setActiveServer] = useState(serverEntries[0]?.[0] || '');
  const [isPlaying, setIsPlaying] = useState(false);

  const currentUrl = servers[activeServer];
  const useSandbox = SANDBOX_COMPATIBLE_SERVERS.includes(activeServer);

  const handlePlay = () => {
    // For all servers, just play the video (PopAds handles monetization)
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
            className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 cursor-pointer"
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
