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

      {/* Main Page Scroll */}
      <ScrollArea className="flex-1 pt-16">
        <main className="pb-12">
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <div className="py-3">
              <Button asChild variant="ghost" size="sm" className="gap-2">
                <Link to="/live-tv">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Live TV
                </Link>
              </Button>
            </div>

            {/* Player Section */}
            <div className="max-w-4xl mx-auto w-full">
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

            {/* Other Channels - Separate Scrollable Section */}
            {otherChannels.length > 0 && (
              <div className="mt-6 max-w-4xl mx-auto w-full">
                <h2 className="text-sm font-semibold mb-3">Other Channels</h2>
                <div className="border border-border rounded-xl bg-card/50 p-3">
                  <ScrollArea className="h-[280px]">
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2 pr-3">
                      {otherChannels.map((ch) => (
                        <button
                          key={ch.id}
                          onClick={() => handleChannelSwitch(ch.id)}
                          className="flex flex-col items-center p-2 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
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
              </div>
            )}
          </div>
        </main>
      </ScrollArea>
    </div>
  );
};

export default WatchLive;
