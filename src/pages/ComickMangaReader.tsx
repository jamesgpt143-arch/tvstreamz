import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  fetchComickChapters,
  fetchComickChapterPages,
  type ComickChapter,
} from '@/lib/comick';
import { fetchMangaDetails, type Manga } from '@/lib/mangadex';
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  BookOpen,
  Columns,
  AlignJustify,
} from 'lucide-react';

type ReadingMode = 'page' | 'longstrip';

const ComickMangaReader = () => {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const [searchParams] = useSearchParams();
  const comickHid = searchParams.get('hid');
  const navigate = useNavigate();

  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<ComickChapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<ComickChapter | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>('page');
  const [showControls, setShowControls] = useState(true);

  // Load manga info and chapters
  useEffect(() => {
    if (!mangaId || !comickHid) return;

    const loadData = async () => {
      const [mangaData, chaptersData] = await Promise.all([
        fetchMangaDetails(mangaId),
        fetchComickChapters(comickHid),
      ]);
      setManga(mangaData);
      setChapters(chaptersData);
    };

    loadData();
  }, [mangaId, comickHid]);

  // Load chapter pages
  useEffect(() => {
    if (!chapterId) return;

    const loadPages = async () => {
      setIsLoading(true);
      setCurrentPage(0);

      const pagesData = await fetchComickChapterPages(chapterId);
      setPages(pagesData);

      // Find current chapter info
      const chapter = chapters.find((c) => c.hid === chapterId);
      setCurrentChapter(chapter || null);

      setIsLoading(false);
    };

    loadPages();
  }, [chapterId, chapters]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readingMode !== 'page') return;

      if (e.key === 'ArrowLeft' || e.key === 'a') {
        prevPage();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        nextPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pages, readingMode]);

  const totalPages = pages.length;

  const nextPage = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      // Go to next chapter
      const currentIndex = chapters.findIndex((c) => c.hid === chapterId);
      if (currentIndex < chapters.length - 1) {
        navigate(`/manga/${mangaId}/read-comick/${chapters[currentIndex + 1].hid}?hid=${comickHid}`);
      }
    }
  }, [currentPage, totalPages, chapters, chapterId, mangaId, comickHid, navigate]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    } else {
      // Go to previous chapter
      const currentIndex = chapters.findIndex((c) => c.hid === chapterId);
      if (currentIndex > 0) {
        navigate(`/manga/${mangaId}/read-comick/${chapters[currentIndex - 1].hid}?hid=${comickHid}`);
      }
    }
  }, [currentPage, chapters, chapterId, mangaId, comickHid, navigate]);

  const goToChapter = (newChapterId: string) => {
    navigate(`/manga/${mangaId}/read-comick/${newChapterId}?hid=${comickHid}`);
  };

  const currentChapterIndex = chapters.findIndex((c) => c.hid === chapterId);
  const hasPrevChapter = currentChapterIndex > 0;
  const hasNextChapter = currentChapterIndex < chapters.length - 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <BookOpen className="w-16 h-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Hindi ma-load ang pages</p>
        <Link to={`/manga/${mangaId}`}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Bumalik sa Manga
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black text-white"
      onClick={() => readingMode === 'page' && setShowControls(!showControls)}
    >
      {/* Top Controls */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto flex items-center justify-between gap-4">
          {/* Back & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link to={`/manga/${mangaId}`}>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <p className="font-medium truncate">{manga?.title}</p>
              <p className="text-sm text-gray-400">
                Chapter {currentChapter?.chap || '?'}
                {currentChapter?.title && ` - ${currentChapter.title}`}
                <span className="ml-2 text-orange-400 text-xs">(ComicK)</span>
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* Chapter Select */}
            <Select value={chapterId} onValueChange={goToChapter}>
              <SelectTrigger className="w-32 md:w-40 bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((ch) => (
                  <SelectItem key={ch.hid} value={ch.hid}>
                    Ch. {ch.chap || '?'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reading Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
              onClick={() => setReadingMode(readingMode === 'page' ? 'longstrip' : 'page')}
              title={readingMode === 'page' ? 'Switch to Long Strip' : 'Switch to Page Mode'}
            >
              {readingMode === 'page' ? (
                <AlignJustify className="w-5 h-5" />
              ) : (
                <Columns className="w-5 h-5" />
              )}
            </Button>

            {/* Home */}
            <Link to="/manga">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                <Home className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      {readingMode === 'page' ? (
        /* Single Page Mode */
        <div className="min-h-screen flex items-center justify-center p-4 pt-20 pb-24">
          <img
            src={pages[currentPage]}
            alt={`Page ${currentPage + 1}`}
            className="max-w-full max-h-[calc(100vh-120px)] object-contain"
            loading="eager"
          />

          {/* Left/Right Click Zones */}
          <div
            className="absolute left-0 top-0 w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              prevPage();
            }}
          />
          <div
            className="absolute right-0 top-0 w-1/3 h-full cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              nextPage();
            }}
          />
        </div>
      ) : (
        /* Long Strip Mode */
        <div className="pt-20 pb-24">
          <div className="max-w-3xl mx-auto">
            {pages.map((pageUrl, index) => (
              <img
                key={index}
                src={pageUrl}
                alt={`Page ${index + 1}`}
                className="w-full"
                loading="lazy"
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto">
          {/* Page Slider (only for page mode) */}
          {readingMode === 'page' && (
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm tabular-nums">{currentPage + 1}</span>
              <input
                type="range"
                min={0}
                max={totalPages - 1}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm tabular-nums">{totalPages}</span>
            </div>
          )}

          {/* Chapter Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={!hasPrevChapter}
              onClick={() => hasPrevChapter && goToChapter(chapters[currentChapterIndex - 1].hid)}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Prev Chapter
            </Button>

            {readingMode === 'page' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={prevPage}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm tabular-nums px-2">
                  {currentPage + 1} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={nextPage}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}

            <Button
              variant="ghost"
              disabled={!hasNextChapter}
              onClick={() => hasNextChapter && goToChapter(chapters[currentChapterIndex + 1].hid)}
              className="text-white hover:bg-white/10"
            >
              Next Chapter
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComickMangaReader;