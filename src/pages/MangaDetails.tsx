import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  fetchMangaDetails,
  fetchMangaChapters,
  getProxiedImageUrl,
  type Manga,
  type Chapter,
} from '@/lib/mangadex';
import {
  searchComickManga,
  fetchComickChapters,
  type ComickChapter,
} from '@/lib/comick';
import { Loader2, BookOpen, ArrowLeft, Calendar, User, Palette, ChevronRight, RefreshCw } from 'lucide-react';

type ChapterSource = 'mangadex' | 'comick';

const MangaDetails = () => {
  const { mangaId } = useParams<{ mangaId: string }>();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comickChapters, setComickChapters] = useState<ComickChapter[]>([]);
  const [comickHid, setComickHid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);
  const [chapterSource, setChapterSource] = useState<ChapterSource>('mangadex');
  const [isSearchingFallback, setIsSearchingFallback] = useState(false);

  useEffect(() => {
    if (!mangaId) return;

    const loadData = async () => {
      setIsLoading(true);
      setIsLoadingChapters(true);
      setChapterSource('mangadex');
      setComickChapters([]);
      setComickHid(null);

      const [mangaData, chaptersData] = await Promise.all([
        fetchMangaDetails(mangaId),
        fetchMangaChapters(mangaId),
      ]);

      setManga(mangaData);
      setChapters(chaptersData);
      setIsLoading(false);
      setIsLoadingChapters(false);

      // If no chapters from MangaDex, try ComicK as fallback
      if (chaptersData.length === 0 && mangaData?.title) {
        setIsSearchingFallback(true);
        console.log('No MangaDex chapters, searching ComicK for:', mangaData.title);
        
        const comickResult = await searchComickManga(mangaData.title);
        
        if (comickResult) {
          console.log('Found on ComicK:', comickResult);
          setComickHid(comickResult.hid);
          
          const comickChaptersData = await fetchComickChapters(comickResult.hid);
          
          if (comickChaptersData.length > 0) {
            setComickChapters(comickChaptersData);
            setChapterSource('comick');
          }
        }
        
        setIsSearchingFallback(false);
      }
    };

    loadData();
  }, [mangaId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Hindi nakita ang manga</p>
          <Link to="/manga">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Bumalik sa Manga
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Get high-res cover and proxy it
  const coverUrl = manga.coverUrl 
    ? getProxiedImageUrl(manga.coverUrl.replace('.256.jpg', '.512.jpg'))
    : null;

  const displayChapters = chapterSource === 'mangadex' ? chapters : comickChapters;
  const hasChapters = displayChapters.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-16">
        {/* Background Blur */}
        {coverUrl && (
          <div
            className="absolute inset-0 h-80 bg-cover bg-center opacity-20 blur-2xl"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        )}

        <div className="relative container mx-auto px-4 py-8">
          {/* Back Button */}
          <Link to="/manga" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Bumalik sa Manga
          </Link>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={manga.title}
                  className="w-48 md:w-64 rounded-xl shadow-2xl mx-auto md:mx-0"
                />
              ) : (
                <div className="w-48 md:w-64 aspect-[2/3] rounded-xl bg-muted flex items-center justify-center">
                  <BookOpen className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-4xl font-bold mb-2">{manga.title}</h1>

              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                {manga.year && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {manga.year}
                  </div>
                )}
                {manga.author && (
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {manga.author}
                  </div>
                )}
                {manga.artist && manga.artist !== manga.author && (
                  <div className="flex items-center gap-1">
                    <Palette className="w-4 h-4" />
                    {manga.artist}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex gap-2 mb-4">
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  manga.status === 'completed'
                    ? 'bg-green-500/20 text-green-500'
                    : manga.status === 'ongoing'
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {manga.status === 'completed' ? '✓ Tapos' : manga.status === 'ongoing' ? '◉ Ongoing' : manga.status}
                </span>
                <span className="px-3 py-1 text-sm bg-secondary rounded-full">
                  {displayChapters.length} chapters
                </span>
                {chapterSource === 'comick' && (
                  <span className="px-3 py-1 text-sm bg-orange-500/20 text-orange-500 rounded-full">
                    via ComicK
                  </span>
                )}
              </div>

              {/* Tags */}
              {manga.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {manga.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {manga.description && (
                <p className="text-muted-foreground leading-relaxed line-clamp-4 md:line-clamp-none">
                  {manga.description}
                </p>
              )}

              {/* Read Button */}
              {hasChapters && (
                <Link 
                  to={
                    chapterSource === 'mangadex' 
                      ? `/manga/${mangaId}/read/${chapters[0].id}`
                      : `/manga/${mangaId}/read-comick/${comickChapters[0].hid}?hid=${comickHid}`
                  }
                >
                  <Button size="lg" className="mt-6">
                    <BookOpen className="w-5 h-5 mr-2" />
                    Basahin ang Chapter 1
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters List */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">📚 Chapters</h2>
          {chapterSource === 'comick' && (
            <span className="text-xs text-orange-500 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Chapters mula sa ComicK
            </span>
          )}
        </div>

        {isLoadingChapters || isSearchingFallback ? (
          <div className="flex items-center justify-center py-10 flex-col gap-2">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            {isSearchingFallback && (
              <p className="text-sm text-muted-foreground">Hinahanap sa ComicK...</p>
            )}
          </div>
        ) : !hasChapters ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Walang available na English chapters</p>
            <p className="text-xs text-muted-foreground mt-2">Hindi nakita sa MangaDex at ComicK</p>
          </div>
        ) : chapterSource === 'mangadex' ? (
          // MangaDex Chapters
          <ScrollArea className="h-[400px] rounded-lg border">
            <div className="divide-y divide-border">
              {chapters.map((chapter, index) => (
                <Link
                  key={chapter.id}
                  to={`/manga/${mangaId}/read/${chapter.id}`}
                  className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {chapter.volume && `Vol. ${chapter.volume} `}
                        Chapter {chapter.chapter || index + 1}
                      </span>
                      {chapter.title && (
                        <span className="text-muted-foreground truncate">
                          - {chapter.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {chapter.scanlationGroup && (
                        <span>{chapter.scanlationGroup}</span>
                      )}
                      <span>{new Date(chapter.publishAt).toLocaleDateString()}</span>
                      <span>{chapter.pages} pages</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </ScrollArea>
        ) : (
          // ComicK Chapters
          <ScrollArea className="h-[400px] rounded-lg border">
            <div className="divide-y divide-border">
              {comickChapters.map((chapter, index) => (
                <Link
                  key={chapter.hid}
                  to={`/manga/${mangaId}/read-comick/${chapter.hid}?hid=${comickHid}`}
                  className="flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {chapter.vol && `Vol. ${chapter.vol} `}
                        Chapter {chapter.chap || index + 1}
                      </span>
                      {chapter.title && (
                        <span className="text-muted-foreground truncate">
                          - {chapter.title}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {chapter.group_name && (
                        <span>{chapter.group_name}</span>
                      )}
                      <span>{new Date(chapter.created_at).toLocaleDateString()}</span>
                      <span className="text-orange-500">ComicK</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Credit */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Data provided by{' '}
          <a
            href="https://mangadex.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            MangaDex
          </a>
          {chapterSource === 'comick' && (
            <>
              {' & '}
              <a
                href="https://comick.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:underline"
              >
                ComicK
              </a>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default MangaDetails;