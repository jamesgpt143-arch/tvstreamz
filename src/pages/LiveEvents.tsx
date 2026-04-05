import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Radio, Trophy, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface LiveEvent {
  sport: string;
  slug: string;
  title: string;
  eventId: string;
}

const sportLabels: Record<string, string> = {
  nba: '🏀 NBA',
  nfl: '🏈 NFL',
  nhl: '🏒 NHL',
  mlb: '⚾ MLB',
  soccer: '⚽ Soccer',
  ncaa: '🏀 NCAA',
  cfb: '🏈 CFB',
};

const sportColors: Record<string, string> = {
  nba: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  nfl: 'bg-green-500/20 text-green-400 border-green-500/30',
  nhl: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  mlb: 'bg-red-500/20 text-red-400 border-red-500/30',
  soccer: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  ncaa: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cfb: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const LiveEvents = () => {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/tvapp-resolver?list_events=true`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!resp.ok) throw new Error('Failed to fetch events');
      const data = await resp.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const sports = [...new Set(events.map(e => e.sport))];
  const filteredEvents = selectedSport
    ? events.filter(e => e.sport === selectedSport)
    : events;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-20 container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Live Events</h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs font-medium">
              <Radio className="w-3 h-3 animate-pulse" />
              LIVE
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Sport filters */}
        {sports.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Button
              variant={selectedSport === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSport(null)}
            >
              All ({events.length})
            </Button>
            {sports.map(sport => (
              <Button
                key={sport}
                variant={selectedSport === sport ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSport(sport)}
              >
                {sportLabels[sport] || sport.toUpperCase()} ({events.filter(e => e.sport === sport).length})
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchEvents}>Try Again</Button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No live events found right now.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back during game times!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map((event) => (
              <Link
                key={event.slug}
                to={`/live-event/${encodeURIComponent(event.slug)}`}
                className="group block"
              >
                <div className="border border-border rounded-xl p-4 bg-card hover:border-primary/50 hover:bg-accent/30 transition-all duration-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${sportColors[event.sport] || 'bg-muted text-muted-foreground'}`}>
                      {sportLabels[event.sport] || event.sport.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-green-500">
                      <Radio className="w-3 h-3 animate-pulse" />
                      Live
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default LiveEvents;
