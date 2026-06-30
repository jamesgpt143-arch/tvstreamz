import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChannels } from '@/hooks/useChannels';
import { Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

export default function LiveTVRedirect() {
  const navigate = useNavigate();
  const { data: channels, isLoading } = useChannels();

  useEffect(() => {
    if (!isLoading && channels) {
      if (channels.length > 0) {
        // Find preferred channel first
        const preferredChannelId = '614ae636-3070-46eb-bb95-88e0fc0738c1';
        const preferredChannel = channels.find(c => c.id === preferredChannelId);
        
        if (preferredChannel) {
          navigate(`/live/${preferredChannel.id}`, { replace: true });
        } else {
          // Fallback to the first available channel
          navigate(`/live/${channels[0].id}`, { replace: true });
        }
      }
    }
  }, [channels, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Navbar />
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mt-20" />
      </div>
    );
  }

  // If no channels exist
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">No channels available.</p>
      </div>
    </div>
  );
}
