import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { ShareButton } from '@/components/ShareButton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Radio, Clock } from 'lucide-react';
import { LivePlayer } from '@/components/LivePlayer';
import type { Channel } from '@/lib/channels';

const WatchEvent = () => {
  const { '*': eventSlug } = useParams();
  const [phTime, setPhTime] = useState('');
  const [proxyStatus, setProxyStatus] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      setPhTime(
        new Intl.DateTimeFormat('en-PH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Manila',
        }).format(new Date())
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const title = eventSlug
    ? eventSlug.split('/').slice(0, 2).pop()?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Live Event'
    : 'Live Event';

  const sport = eventSlug?.split('/')[0]?.toUpperCase() || '';
  
  const channel: Channel | null = eventSlug ? {
    id: `event-${eventSlug.replace(/[^a-zA-Z0-9]/g, '-')}`,
    name: title,
    manifestUri: '', // Will be resolved by LivePlayer using tvappSlug
    type: 'hls',
    logo: '',
    tvappSlug: eventSlug,
    useProxy: true,
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
            {/* Event Card */}
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4 md:space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {sport && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/20 text-primary">
                      {sport}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 text-xs">
                    <Radio className="w-3 h-3 text-destructive animate-pulse" />
                    <span className="text-destructive font-medium">LIVE</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>PH Time: {phTime}</span>
                </div>
              </div>

              {/* Title & Proxy Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h1 className="text-lg md:text-xl font-bold">{title}</h1>
                {proxyStatus && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                    {proxyStatus}
                  </span>
                )}
              </div>

              {/* Player Area */}
              <div className="w-full">
                {channel ? (
                  <LivePlayer 
                    channel={channel} 
                    onProxyChange={setProxyStatus} 
                  />
                ) : (
                  <div className="aspect-video bg-muted/30 rounded-xl flex items-center justify-center border border-border/50">
                    <p className="text-muted-foreground">Invalid event URL</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-2">
                <ShareButton title={`Watch ${title} - Live`} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WatchEvent;
