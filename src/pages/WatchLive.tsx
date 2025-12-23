import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { liveChannels } from '@/lib/channels';
import { ChevronLeft, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const WatchLive = () => {
  const { channelId } = useParams<{ channelId: string }>();
  const navigate = useNavigate();
  const channel = liveChannels.find((c) => c.id === channelId);

  if (!channel) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Channel not found</h1>
          <Button asChild>
            <Link to="/live-tv">Back to Live TV</Link>
          </Button>
        </div>
      </div>
    );
  }

  const otherChannels = liveChannels.filter((c) => c.id !== channelId);

  const handleChannelSwitch = (newChannelId: string) => {
    navigate(`/live/${newChannelId}`, { replace: true });
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-16 flex flex-col overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col h-full overflow-hidden">
          {/* Back Button - Fixed */}
          <div className="py-3 flex-shrink-0">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/live-tv">
                <ChevronLeft className="w-4 h-4" />
                Back to Live TV
              </Link>
            </Button>
          </div>

          {/* Player Section - Fixed */}
          <div className="flex-shrink-0 max-w-4xl mx-auto w-full">
            {/* Channel Info */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-10 h-10 object-contain rounded-lg bg-secondary p-1.5"
              />
              <div>
                <h1 className="text-lg font-bold">{channel.name}</h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Radio className="w-3 h-3 text-destructive animate-pulse" />
                  <span>Live Now</span>
                </div>
              </div>
            </div>

            {/* Player */}
            <LivePlayer channel={channel} />
          </div>

          {/* Other Channels - Scrollable Section */}
          {otherChannels.length > 0 && (
            <div className="flex-1 mt-4 min-h-0 max-w-4xl mx-auto w-full">
              <h2 className="text-sm font-semibold mb-2 flex-shrink-0">Other Channels</h2>
              <ScrollArea className="h-[calc(100%-2rem)]">
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pb-4">
                  {otherChannels.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => handleChannelSwitch(ch.id)}
                      className="flex flex-col items-center p-2 rounded-lg bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                    >
                      <img
                        src={ch.logo}
                        alt={ch.name}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-md bg-secondary/50 p-1"
                      />
                      <p className="font-medium text-[9px] sm:text-[10px] group-hover:text-primary transition-colors text-center mt-1.5 line-clamp-1 w-full">
                        {ch.name}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WatchLive;
