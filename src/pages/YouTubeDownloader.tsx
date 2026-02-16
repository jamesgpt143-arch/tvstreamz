import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Download, Play, Loader2, Youtube, ArrowLeft, Film, Music, FileVideo } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  lengthText: string;
  viewCount: string;
  publishedTimeText: string;
}

interface VideoFormat {
  url: string;
  quality: string;
  mimeType: string;
  qualityLabel?: string;
  bitrate?: number;
  contentLength?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
}

interface VideoDetails {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  description: string;
  viewCount: string;
  lengthText: string;
  videos: { items: VideoFormat[] };
  audios: { items: VideoFormat[] };
}

const YouTubeDownloader = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSelectedVideo(null);

    try {
      // Check if it's a YouTube URL and extract video ID
      const videoIdMatch = query.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
      
      if (videoIdMatch) {
        await fetchVideoDetails(videoIdMatch[1]);
        setLoading(false);
        return;
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-downloader?action=search&query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const searchData = await res.json();

      if (searchData.error || searchData.message) {
        toast.error(searchData.error || searchData.message);
        return;
      }

      const items = searchData?.items || [];
      const mapped: SearchResult[] = items
        .filter((item: any) => item.type === 'video')
        .map((item: any) => ({
          id: item.id,
          title: item.title,
          channelTitle: item.channelTitle || item.channelName || '',
          thumbnailUrl: item.thumbnails?.[0]?.url || '',
          lengthText: item.lengthText || '',
          viewCount: item.viewCount || '',
          publishedTimeText: item.publishedTimeText || '',
        }));

      setResults(mapped);
      if (mapped.length === 0) toast.info('Walang nakitang resulta');
    } catch (err) {
      console.error(err);
      toast.error('Nagka-error sa paghahanap');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoDetails = async (videoId: string) => {
    setDetailsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-downloader?action=details&videoId=${encodeURIComponent(videoId)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );
      const data = await res.json();

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSelectedVideo({
        id: data.id,
        title: data.title,
        channelTitle: data.channelTitle || '',
        thumbnailUrl: data.thumbnails?.[data.thumbnails.length - 1]?.url || '',
        description: data.description || '',
        viewCount: data.viewCount || '',
        lengthText: data.lengthText || '',
        videos: data.videos || { items: [] },
        audios: data.audios || { items: [] },
      });
    } catch (err) {
      console.error(err);
      toast.error('Hindi makuha ang video details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatSize = (bytes: string | undefined) => {
    if (!bytes) return '';
    const mb = parseInt(bytes) / (1024 * 1024);
    return mb > 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <Youtube className="w-7 h-7 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">YouTube Downloader</h1>
              <p className="text-sm text-muted-foreground">Mag-search o mag-paste ng YouTube link</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8 max-w-2xl">
          <Input
            placeholder="Paste Youtube Video URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-base"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">Hanapin</span>
          </Button>
        </div>

        {/* Video Details */}
        {detailsLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        )}

        {selectedVideo && !detailsLoading && (
          <div className="space-y-6 mb-10">
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  <img src={selectedVideo.thumbnailUrl} alt={selectedVideo.title} className="w-full aspect-video object-cover" />
                  <Badge className="absolute bottom-2 right-2 bg-black/80">{selectedVideo.lengthText}</Badge>
                </div>
                <div className="p-5 md:w-1/2 space-y-2">
                  <h2 className="text-lg font-bold line-clamp-2">{selectedVideo.title}</h2>
                  <p className="text-sm text-muted-foreground">{selectedVideo.channelTitle}</p>
                  <p className="text-xs text-muted-foreground">{parseInt(selectedVideo.viewCount || '0').toLocaleString()} views</p>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedVideo(null)}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Bumalik
                  </Button>
                </div>
              </div>
            </Card>

            {/* Video Downloads */}
            {selectedVideo.videos?.items?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <FileVideo className="w-5 h-5 text-blue-500" /> Video
                </h3>
                <div className="grid gap-2">
                  {selectedVideo.videos.items
                    .filter((v) => v.url)
                    .map((format, i) => (
                      <a
                        key={i}
                        href={format.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Film className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{format.qualityLabel || format.quality}</p>
                            <p className="text-xs text-muted-foreground">
                              {format.mimeType?.split(';')[0]} {format.hasAudio ? '• Audio ✓' : '• No Audio'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {format.contentLength && (
                            <span className="text-xs text-muted-foreground">{formatSize(format.contentLength)}</span>
                          )}
                          <Download className="w-4 h-4 text-primary" />
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* Audio Downloads */}
            {selectedVideo.audios?.items?.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <Music className="w-5 h-5 text-green-500" /> Audio
                </h3>
                <div className="grid gap-2">
                  {selectedVideo.audios.items
                    .filter((a) => a.url)
                    .map((format, i) => (
                      <a
                        key={i}
                        href={format.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{format.quality}</p>
                            <p className="text-xs text-muted-foreground">{format.mimeType?.split(';')[0]}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {format.contentLength && (
                            <span className="text-xs text-muted-foreground">{formatSize(format.contentLength)}</span>
                          )}
                          <Download className="w-4 h-4 text-green-500" />
                        </div>
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {!selectedVideo && results.length > 0 && (
          <div className="grid gap-3">
            {results.map((video) => (
              <Card
                key={video.id}
                className="flex flex-col sm:flex-row overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fetchVideoDetails(video.id)}
              >
                <div className="sm:w-56 shrink-0 relative">
                  <img src={video.thumbnailUrl} alt={video.title} className="w-full aspect-video object-cover" />
                  {video.lengthText && (
                    <Badge className="absolute bottom-1 right-1 bg-black/80 text-[10px]">{video.lengthText}</Badge>
                  )}
                </div>
                <div className="p-3 flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{video.channelTitle}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{video.viewCount}</span>
                    {video.publishedTimeText && <span>• {video.publishedTimeText}</span>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !detailsLoading && !selectedVideo && results.length === 0 && (
          <div className="text-center py-20">
            <Youtube className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Mag-search o mag-paste ng YouTube link</h3>
            <p className="text-sm text-muted-foreground mt-1">I-paste ang URL o i-type ang keyword para mag-search</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default YouTubeDownloader;
