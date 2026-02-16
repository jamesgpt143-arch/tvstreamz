import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Youtube, ArrowLeft, Film, Music } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface QualityOption {
  id: string;
  quality: string;
  mimeType: string;
  size?: string;
  hasAudio?: boolean;
  hasVideo?: boolean;
  type: 'video' | 'audio';
}

interface VideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  lengthText: string;
  qualities: QualityOption[];
}

const YouTubeDownloader = () => {
  const [query, setQuery] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const extractVideoId = (input: string): string | null => {
    const match = input.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    const videoId = extractVideoId(query);
    if (!videoId) {
      toast.error('Mag-paste ng valid na YouTube URL');
      return;
    }

    setLoading(true);
    setVideoInfo(null);

    try {
      // Fetch video details
      const detailsRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-downloader?action=details&videoId=${encodeURIComponent(videoId)}`,
        { headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );
      const detailsData = await detailsRes.json();

      // Fetch quality options
      const qualityRes = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-downloader?action=quality&videoId=${encodeURIComponent(videoId)}`,
        { headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` } }
      );
      const qualityData = await qualityRes.json();

      if (detailsData.error) {
        toast.error(detailsData.error);
        return;
      }

      // Parse qualities from the response
      const qualities: QualityOption[] = [];

      // Video qualities
      const videoFormats = qualityData?.video_formats || qualityData?.videos || qualityData?.formats || [];
      if (Array.isArray(videoFormats)) {
        videoFormats.forEach((f: any) => {
          qualities.push({
            id: String(f.id || f.itag || f.quality_id || ''),
            quality: f.quality || f.qualityLabel || f.label || '',
            mimeType: f.mimeType || f.mime_type || 'video/mp4',
            size: f.size || f.contentLength || '',
            hasAudio: f.hasAudio ?? true,
            hasVideo: true,
            type: 'video',
          });
        });
      }

      // Audio qualities
      const audioFormats = qualityData?.audio_formats || qualityData?.audios || [];
      if (Array.isArray(audioFormats)) {
        audioFormats.forEach((f: any) => {
          qualities.push({
            id: String(f.id || f.itag || f.quality_id || ''),
            quality: f.quality || f.qualityLabel || f.label || f.bitrate || '',
            mimeType: f.mimeType || f.mime_type || 'audio/mp4',
            size: f.size || f.contentLength || '',
            hasAudio: true,
            hasVideo: false,
            type: 'audio',
          });
        });
      }

      // Parse video info from details response
      const info = detailsData?.videos?.[0] || detailsData;
      setVideoInfo({
        id: videoId,
        title: info.title || info.name || 'Unknown',
        channelTitle: info.channelTitle || info.channel || info.author || '',
        thumbnailUrl: info.thumbnail || info.thumbnailUrl || info.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        lengthText: info.lengthText || info.duration || '',
        qualities,
      });

      if (qualities.length === 0) {
        toast.info('Video info loaded. Mga download options ay makikita sa ibaba.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Nagka-error sa pagkuha ng video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (quality: QualityOption) => {
    if (!videoInfo) return;
    setDownloadingId(quality.id);
    toast.info('Sinisimulan ang download... (maaaring tumagal ng 15-30 segundo)');

    try {
      const ext = quality.type === 'audio' ? 'mp3' : 'mp4';
      const filename = `${videoInfo.title.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50) || 'video'}_${quality.quality}.${ext}`;

      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-download-proxy?videoId=${encodeURIComponent(videoInfo.id)}&quality=${encodeURIComponent(quality.id)}&filename=${encodeURIComponent(filename)}&type=${quality.type}`;

      const response = await fetch(proxyUrl, {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });

      const contentType = response.headers.get('content-type') || '';

      // If JSON response, it might be a redirect URL
      if (contentType.includes('application/json')) {
        const data = await response.json();
        if (data.redirect) {
          window.open(data.redirect, '_blank');
          toast.info('Na-redirect sa download link. I-try ulit kung hindi gumana.');
          return;
        }
        if (data.error) {
          toast.error(data.error);
          return;
        }
      }

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('Download complete!');
    } catch (err) {
      console.error(err);
      toast.error('Hindi ma-download. Subukan ulit.');
    } finally {
      setDownloadingId(null);
    }
  };

  const videoQualities = videoInfo?.qualities.filter(q => q.type === 'video') || [];
  const audioQualities = videoInfo?.qualities.filter(q => q.type === 'audio') || [];

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
              <p className="text-sm text-muted-foreground">Mag-paste ng YouTube link para mag-download</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8 max-w-2xl">
          <Input
            placeholder="Paste YouTube Video URL"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="text-base"
          />
          <Button onClick={handleSearch} disabled={loading} className="bg-red-500 hover:bg-red-600 text-white shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="ml-2 hidden sm:inline">Kunin</span>
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        )}

        {/* Video Info & Download Options */}
        {videoInfo && !loading && (
          <div className="space-y-6 mb-10">
            <Card className="overflow-hidden">
              <div className="md:flex">
                <div className="md:w-1/2 relative">
                  <img src={videoInfo.thumbnailUrl} alt={videoInfo.title} className="w-full aspect-video object-cover" />
                  {videoInfo.lengthText && (
                    <Badge className="absolute bottom-2 right-2 bg-black/80">{videoInfo.lengthText}</Badge>
                  )}
                </div>
                <div className="p-5 md:w-1/2 space-y-2">
                  <h2 className="text-lg font-bold line-clamp-2">{videoInfo.title}</h2>
                  <p className="text-sm text-muted-foreground">{videoInfo.channelTitle}</p>
                  <Button variant="ghost" size="sm" onClick={() => { setVideoInfo(null); setQuery(''); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Bagong URL
                  </Button>
                </div>
              </div>
            </Card>

            {/* Video Downloads */}
            {videoQualities.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <Film className="w-5 h-5 text-blue-500" /> Video
                </h3>
                <div className="grid gap-2">
                  {videoQualities.map((q) => (
                    <button
                      key={`v-${q.id}`}
                      onClick={() => handleDownload(q)}
                      disabled={downloadingId === q.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Film className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{q.quality}</p>
                          <p className="text-xs text-muted-foreground">
                            {q.mimeType?.split(';')[0]} {q.hasAudio ? '• Audio ✓' : '• No Audio'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.size && <span className="text-xs text-muted-foreground">{q.size}</span>}
                        {downloadingId === q.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                          <Download className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Downloads */}
            {audioQualities.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-3">
                  <Music className="w-5 h-5 text-green-500" /> Audio
                </h3>
                <div className="grid gap-2">
                  {audioQualities.map((q) => (
                    <button
                      key={`a-${q.id}`}
                      onClick={() => handleDownload(q)}
                      disabled={downloadingId === q.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Music className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{q.quality}</p>
                          <p className="text-xs text-muted-foreground">{q.mimeType?.split(';')[0]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.size && <span className="text-xs text-muted-foreground">{q.size}</span>}
                        {downloadingId === q.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                        ) : (
                          <Download className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !videoInfo && (
          <div className="text-center py-20">
            <Youtube className="w-16 h-16 text-red-500/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">Mag-paste ng YouTube link</h3>
            <p className="text-sm text-muted-foreground mt-1">I-paste ang URL ng video para makita ang download options</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default YouTubeDownloader;
