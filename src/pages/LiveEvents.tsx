import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Trophy, Calendar, Video } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveEvent {
  sport: string;
  slug: string;
  title: string;
  eventId: string;
}

const LiveEvents = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/tvapp-resolver?list_events=true`);
        
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err: any) {
        setError(err.message || 'Error loading events');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">NBA Live Events</h1>
              <p className="text-muted-foreground">Watch upcoming and live NBA games</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center border rounded-xl bg-destructive/10 text-destructive border-destructive">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">No NBA events found at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => (
                <Link
                  key={event.slug}
                  to={`/live-event/${event.slug}`}
                  className="block p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent group transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg max-w-xs">{event.title || event.eventId.replace(/-/g, ' ')}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="uppercase font-medium bg-orange-500/20 text-orange-500 px-2 py-0.5 rounded">
                          {event.sport || 'NBA'}
                        </span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Today</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-2">
                      <Video className="w-5 h-5 text-primary group-hover:text-current" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveEvents;
