import { useState, useEffect } from 'react';
import { fetchAnimeSchedule } from '@/lib/anime-db';
import { ContentCard } from '@/components/ContentCard';
import { Calendar, Loader2 } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const AnimeSchedule = () => {
  const [activeDay, setActiveDay] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set initial day to today based on user's local time
    const todayIndex = new Date().getDay();
    // JS getDay(): 0 = Sunday, 1 = Monday. We want 0 = Monday
    const adjustedIndex = todayIndex === 0 ? 6 : todayIndex - 1;
    setActiveDay(DAYS[adjustedIndex]);
  }, []);

  useEffect(() => {
    if (!activeDay) return;

    const loadSchedule = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAnimeSchedule(activeDay);
        setItems(data);
      } catch (error) {
        console.error('Failed to load schedule:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchedule();
  }, [activeDay]);

  return (
    <section className="py-16 md:py-24 border-t border-white/5 bg-background relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-orange-500" />
              <h2 className="text-3xl md:text-4xl font-black uppercase tracking-[0.1em] text-white">
                Release Schedule
              </h2>
            </div>
            <p className="text-zinc-400 font-medium tracking-wide">
              Catch new episodes of your favorite currently airing anime.
            </p>
          </div>
        </div>

        {/* Days Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-4 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
          {DAYS.map((day) => {
            const isActive = activeDay === day;
            const isToday = day === DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
            
            return (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`flex flex-col items-center min-w-[100px] py-3 px-4 rounded-2xl border transition-all duration-300 ${
                  isActive
                    ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] scale-105 font-black'
                    : 'bg-zinc-900/50 text-zinc-400 border-white/5 hover:bg-zinc-800 hover:text-white font-bold'
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest opacity-80 mb-1">
                  {isToday ? 'Today' : 'Airing'}
                </span>
                <span className="text-sm tracking-wide">{day.substring(0, 3)}</span>
              </button>
            );
          })}
        </div>

        {/* Content Grid/Row */}
        <div className="min-h-[300px]">
          {isLoading ? (
            <div className="w-full h-[300px] flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                <Calendar className="absolute inset-0 m-auto w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 animate-pulse">Loading schedule...</p>
            </div>
          ) : items.length > 0 ? (
            <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x">
              {items.map((item) => (
                <div key={item.mal_id} className="min-w-[160px] sm:min-w-[180px] md:min-w-[200px] snap-start">
                  <ContentCard item={item} type="anime" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full h-[300px] flex flex-col items-center justify-center bg-zinc-900/30 rounded-[2rem] border border-dashed border-white/10">
              <Calendar className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-lg font-bold text-zinc-500">No major anime scheduled for {activeDay}.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
