import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ShareButton } from '@/components/ShareButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Radio, Loader2, AlertCircle } from 'lucide-react';

const WatchEvent = () => {
  const { '*': eventSlug } = useParams();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const resolveStream = useCallback(async () => {
    if (!eventSlug) return;
    setLoading(true);
    setError(null);
    setEmbedUrl(null);

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/tvapp-resolver?event_slug=${encodeURIComponent(eventSlug)}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );

      const data = await resp.json();
      if (data.resolved_url) {
        // If resolved URL is a direct m3u8, use the player
        if (data.resolved_url.includes('.m3u8')) {
          setStreamUrl(data.resolved_url);
        } else {
          // Non-m3u8 URL (e.g. playlist loader) — use embed approach
          // Build the embed URL from the event slug
          setEmbedUrl(`https://thetvapp.link/${eventSlug}`);
        }
      } else {
        setError(data.error || 'Could not resolve stream');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resolve stream');
    } finally {
      setLoading(false);
    }
  }, [eventSlug]);

  useEffect(() => {
    resolveStream();
  }, [resolveStream]);

  // Build a display title from the slug
  const title = eventSlug
    ? eventSlug.split('/').slice(0, 2).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Live Event'
    : 'Live Event';

  const sport = eventSlug?.split('/')[0]?.toUpperCase() || '';

  // Create a pseudo-channel for LivePlayer (only used for direct m3u8)
  const pseudoChannel = streamUrl ? {
    id: `event-${eventSlug}`,
    name: title,
    logo: '',
    manifestUri: streamUrl,
    type: 'hls' as const,
    category: sport,
    useProxy: true,
    proxyType: 'supabase' as const,
  } : null;

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
                  {isOnline ? (
                    <>
                      <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                      <span className="text-green-500">Live</span>
                    </>
                  ) : (
                    <span className="text-destructive">Offline</span>
                  )}
                </div>
              </div>
            </div>

            {/* Player */}
            {loading ? (
              <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Resolving stream...</p>
                </div>
              </div>
            ) : error ? (
              <div className="aspect-video bg-card rounded-xl flex items-center justify-center">
                <div className="text-center px-4">
                  <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
                  <p className="text-sm text-destructive mb-3">{error}</p>
                  <Button size="sm" onClick={resolveStream}>Retry</Button>
                </div>
              </div>
            ) : embedUrl ? (
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <iframe
                  src={embedUrl}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
            ) : pseudoChannel ? (
              <LivePlayer
                channel={pseudoChannel}
                onStatusChange={setIsOnline}
              />
            ) : null}

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