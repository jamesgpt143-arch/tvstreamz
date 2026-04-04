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
        // Use allorigins to bypass CORS
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent('https://thetvapp.to/nba')}`);
        
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const html = await response.text();
        // Robust regex to extract href and everything inside <a>
        const eventPattern = /<a[^>]*href=["'](\/event\/[a-z0-9-]+)['"][^>]*>([\s\S]*?)<\/a>/gi;
        const scrapedEvents: LiveEvent[] = [];
        const seen = new Set<string>();
        
        for (const match of html.matchAll(eventPattern)) {
          let path = match[1];
          if (path.startsWith('/')) path = path.substring(1);
          
          // Clean HTML tags and newlines
          let titleRaw = match[2] || '';
          let title = titleRaw.replace(/<[^>]*>/g, '').replace(/[\n\r]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
          
          let eventTime = '';
          if (title.includes('@')) {
            const parts = title.split('@');
            title = parts[0].trim();
            eventTime = parts[1].trim() + ' EST';
          }
          
          if (seen.has(path)) continue;
          seen.add(path);
          
          const eventId = path.split('/')[1] || path;
          scrapedEvents.push({ sport: 'nba', slug: path, title, eventId, eventTime });
        }
        
        setEvents(scrapedEvents);
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
              {events.map((event) => {
                let displayTime = 'Today';
                let displayDate = '';
                
                if (event.eventTime) {
                  try {
                    // Extract strings like "Apr 3 8:00 PM EST" to Date object
                    const currentYear = new Date().getFullYear();
                    const dateObj = new Date(`${event.eventTime} ${currentYear}`);
                    
                    if (!isNaN(dateObj.getTime())) {
                      // Convert to PH Time (Asia/Manila)
                      displayTime = dateObj.toLocaleString('en-US', {
                        timeZone: 'Asia/Manila',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                      
                      displayDate = dateObj.toLocaleString('en-US', {
                        timeZone: 'Asia/Manila',
                        month: 'short',
                        day: 'numeric'
                      });
                    } else {
                      displayTime = event.eventTime.replace('EST', '').trim();
                    }
                  } catch(e) {
                    displayTime = event.eventTime.replace('EST', '').trim();
                  }
                }

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
