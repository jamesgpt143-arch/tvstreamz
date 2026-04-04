import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ArrowLeft, Trophy } from 'lucide-react';

const WatchEvent = () => {
  const { "*": rawSlug } = useParams();
  const eventSlug = "event/" + rawSlug; // since the path matched is live-event/*

  // Create a synthetic channel object to feed into LivePlayer
  const channel = {
    id: `event-${rawSlug}`,
    name: 'NBA Live Event',
    manifestUri: '',
    type: 'hls' as const,
    logo: 'https://cdn-icons-png.flaticon.com/512/889/889508.png',
    tvappSlug: undefined, // ensure this is undefined to avoid slug conflicts
    eventSlug: eventSlug, // passes this to trigger the backend ?event_slug=
    useProxy: false, // The backend already returns the m3u8 directly for many events
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link 
            to="/live-events"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to NBA Events
          </Link>
          
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-orange-500" />
              </div>
              <h1 className="text-2xl font-bold max-w-[80vw] truncate">Watch Event</h1>
            </div>
          </div>
          
          <LivePlayer channel={channel as any} />
        </div>
      </main>
    </div>
  );
};

export default WatchEvent;
