import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { LivePlayer } from '@/components/LivePlayer';
import { ShareButton } from '@/components/ShareButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Radio, Loader2, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const WatchEvent = () => {
  const { '*': eventSlug } = useParams();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const resolveStream = useCallback(async () => {
    if (!eventSlug) return;
    setLoading(true);
    setError(null);

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
        setStreamUrl(data.resolved_url);
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

  // IN-UPDATE: Smart Proxy & Native CORS Bypass
  const pseudoChannel = streamUrl ? {
    id: `event-${eventSlug}`,
    name: title,
    logo: '',
    manifestUri: streamUrl,
    type: 'hls' as const,
    category: sport,
    // KUNG NASA ANDROID APK: false (Direct Play). KUNG NASA WEB: true (Proxy)
    useProxy: !Capacitor.isNativePlatform(),
    proxyType: 'supabase' as const,
    referrer: 'https://thetvapp.to/',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
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
