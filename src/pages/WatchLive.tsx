import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { liveChannels } from '@/lib/channels';
import { ChevronLeft, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';

const WatchLive = () => {
  const { channelId } = useParams<{ channelId: string }>();
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

          {/* Main Content - Same max-width as Movies/TV Shows */}
          <div className="max-w-5xl">
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

            {/* Player */}
            <LivePlayer channel={channel} />
          </div>

          {/* Other Channels - Horizontal Scroll */}
          {otherChannels.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold mb-4">Other Channels</h2>
              <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                {otherChannels.map((ch) => (
                  <Link
                    key={ch.id}
                    to={`/live/${ch.id}`}
                    className="flex-shrink-0 flex items-center gap-3 p-3 pr-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <img
                      src={ch.logo}
                      alt={ch.name}
                      className="w-12 h-12 object-contain rounded-lg bg-secondary/50 p-1.5"
                    />
                    <div>
                      <p className="font-medium text-sm group-hover:text-primary transition-colors whitespace-nowrap">
                        {ch.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Radio className="w-3 h-3 text-destructive animate-pulse" />
                        <span>Live</span>
                      </div>
                    </div>
                  </Link>
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
