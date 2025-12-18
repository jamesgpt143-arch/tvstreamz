import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ChannelCard } from '@/components/ChannelCard';
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

          {/* Channel Info */}
          <div className="flex items-center gap-4 mb-6">
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-16 h-16 object-contain rounded-lg bg-secondary p-2"
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{channel.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Radio className="w-4 h-4 text-destructive animate-pulse" />
                <span>Live Now</span>
              </div>
            </div>
          </div>

          {/* Player */}
          <LivePlayer channel={channel} />

          {/* Other Channels */}
          {otherChannels.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold mb-4">Other Channels</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {otherChannels.map((ch) => (
                  <ChannelCard key={ch.id} channel={ch} />
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
