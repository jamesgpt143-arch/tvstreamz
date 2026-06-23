import { getImageUrl } from '@/lib/tmdb';

interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface CastSectionProps {
  cast?: CastMember[];
}

export const CastSection = ({ cast }: CastSectionProps) => {
  if (!cast || cast.length === 0) return null;

  // Show top 12 cast members
  const topCast = cast.slice(0, 12);

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-white/5 shadow-xl mt-8">
      <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
        <span className="w-2 h-8 bg-primary rounded-full" />
        Cast & Characters
      </h2>
      
      <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar">
        {topCast.map((person) => (
          <div key={person.id} className="min-w-[120px] max-w-[120px] flex flex-col items-center text-center">
            <div className="w-24 h-24 mb-3 rounded-full overflow-hidden border-2 border-white/10 shadow-lg">
              <img
                src={getImageUrl(person.profile_path, 'w200')}
                alt={person.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=random`;
                }}
              />
            </div>
            <p className="text-sm font-bold text-white leading-tight mb-1">{person.name}</p>
            <p className="text-xs text-zinc-400 line-clamp-2">{person.character}</p>
          </div>
        ))}
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
};
