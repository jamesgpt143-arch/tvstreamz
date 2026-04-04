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
  eventTime?: string;
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
        
        if (!response.ok) {
          console.error(`[LiveEvents] API error: ${response.status}`);
          throw new Error(`Failed to fetch events: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`[LiveEvents] Received ${data.events?.length || 0} events`);
        setEvents(data.events || []);
      } catch (err: any) {
        console.error('[LiveEvents] Error:', err);
        setError(err.message || 'Error loading events');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // Helper function to parse and format event time
  const formatEventTime = (eventTime?: string) => {
    if (!eventTime) return { displayTime: 'TBA', displayDate: '' };

    try {
      console.log(`[formatEventTime] Processing: ${eventTime}`);
      
      // Get current date in US EST timezone
      const todayUS = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' });
      
      // Clean the time string - remove EST/EDT
      let cleanTime = eventTime.replace(/(EST|EDT|CST|MST|PST)/i, '').trim();
      
      // Detect current timezone offset for accurate EST/EDT
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const utcTime = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
      const offset = (estTime.getTime() - utcTime.getTime()) / (1000 * 60 * 60);
      const timezone = offset === -4 ? 'EDT' : 'EST';
      
      // Ensure we have timezone info
      if (!cleanTime.match(/EST|EDT|CST|MST|PST/i)) {
        cleanTime = `${cleanTime} ${timezone}`;
      }
      
      // Parse the date: "MM/DD/YYYY HH:MM AM EST"
      const dateObj = new Date(`${todayUS} ${cleanTime}`);
      
      if (!isNaN(dateObj.getTime())) {
        // Convert to Philippine Time
        const displayTime = dateObj.toLocaleString('en-US', {
          timeZone: 'Asia/Manila',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        const displayDate = dateObj.toLocaleString('en-US', {
          timeZone: 'Asia/Manila',
          month: 'short',
          day: 'numeric'
        });
        
        console.log(`[formatEventTime] Formatted: ${displayDate} | ${displayTime} (PH)`);
        return { displayTime, displayDate };
      } else {
        console.warn(`[formatEventTime] Invalid date: ${todayUS} ${cleanTime}`);
        // Fallback: just remove timezone and return
        return { displayTime: eventTime.replace(/(EST|EDT|CST|MST|PST)/i, '').trim(), displayDate: '' };
      }
    } catch(e) {
      console.error('[formatEventTime] Error:', e);
      // Final fallback
      return { displayTime: eventTime.replace(/(EST|EDT|CST|MST|PST)/i, '').trim(), displayDate: '' };
    }
  };

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
              <p className="font-semibold">Error Loading Events</p>
              <p className="text-sm mt-2">{error}</p>
              <p className="text-xs mt-4 text-muted-foreground">Check browser console for more details</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center p-12 bg-card rounded-xl border border-border">
              <p className="text-muted-foreground">No NBA events found at the moment.</p>
              <p className="text-xs mt-2 text-muted-foreground">Events will appear here when they're available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map((event) => {
                const { displayTime, displayDate } = formatEventTime(event.eventTime);
                
                return (
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
                          <div className="flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{displayDate ? `${displayDate} | ${displayTime} (PH)` : displayTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors mt-2">
                        <Video className="w-5 h-5 text-primary group-hover:text-current" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveEvents;