import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ShareButton } from '@/components/ShareButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Radio, Loader2, AlertCircle } from 'lucide-react';

const TVAPP_LINK_BASE = 'https://thetvapp.link';

const WatchEvent = () => {
  const { '*': eventSlug } = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Brief loading state for UX
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [eventSlug]);

  // Build a display title from the slug
  const title = eventSlug
    ? eventSlug.split('/').slice(0, 2).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Live Event'
    : 'Live Event';

  const sport = eventSlug?.split('/')[0]?.toUpperCase() || '';

  // Build the iframe URL directly to the event page
  const iframeSrc = eventSlug ? `${TVAPP_LINK_BASE}/${eventSlug}` : null;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 pt-16 overflow-auto pb-12">
        <div className="container mx-auto px-4">
          <div className="py-3">
            <Button asChild variant="ghost" size="sm" className="gap-2">
              <Link to="/live-events">
                <ChevronLeft className="w-4 h-4" />
                Back to Live Events
              </Link>
            </Button>
          </div>

          <div className="max-w-4xl mx-auto w-full">
            {/* Event Info */}
            <div className="flex items-center gap-3 mb-3">
              <div>
                <h1 className="text-lg font-bold">{title}</h1>
                <div className="flex items-center gap-2 text-xs">
                  {sport && (
                    <span className="text-muted-foreground font-medium">{sport}</span>
                  )}
                  <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                  <span className="text-green-500">Live</span>
                </div>
              </div>
            </div>

            {/* Player via iframe */}
            {loading ? (
              <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Loading stream...</p>
                </div>
              </div>
            ) : iframeSrc ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={iframeSrc}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                <div className="text-center px-4">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                  <p className="text-sm text-destructive">No event URL available</p>
                </div>
              </div>
            )}

            <div className="flex justify-start mt-3">
              <ShareButton title={`Watch ${title} - Live`} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchEvent;
