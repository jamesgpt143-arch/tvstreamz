import { useParams, Link, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { LiveChat } from '@/components/LiveChat';
import { liveChannels } from '@/lib/channels';
import { ChevronLeft, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Button asChild variant="ghost" className="mb-4 gap-2">
            <Link to="/live-tv">
              <ChevronLeft className="w-4 h-4" />
              Back to Live TV
            </Link>
          </Button>

          {/* Main Content with Player and Chat side by side on desktop */}
          <div className="max-w-6xl mx-auto">
            {/* Channel Info */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-14 h-14 object-contain rounded-lg bg-secondary p-2"
              />
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{channel.name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Radio className="w-4 h-4 text-destructive animate-pulse" />
                  <span>Live Now</span>
                </div>
              </div>
            </div>

            {/* Player and Chat Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
              {/* Player */}
              <div>
                <LivePlayer channel={channel} />
              </div>
              
              {/* Live Chat - Side on desktop, below on mobile */}
              <div className="lg:h-auto">
                <LiveChat channelId={channelId!} />
              </div>
            </div>
          </div>

          {/* Other Channels - Grid Layout */}
          {otherChannels.length > 0 && (
            <section className="mt-10 max-w-6xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Other Channels</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {otherChannels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelSwitch(ch.id)}
                    className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-lg bg-secondary/50 p-1"
                    />
                    <p className="font-medium text-[10px] sm:text-xs group-hover:text-primary transition-colors text-center mt-2 line-clamp-1">
                      {ch.name}
                    </p>
                    <div className="flex items-center gap-1 text-[8px] sm:text-[10px] text-muted-foreground mt-0.5">
                      <Radio className="w-2 h-2 text-destructive animate-pulse" />
                      <span>Live</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default WatchLive;
