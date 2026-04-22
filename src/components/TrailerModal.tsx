import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrailerModalProps {
  trailerUrl: string;
  title: string;
  onClose: () => void;
  onSkip: () => void;
}

export const TrailerModal = ({ trailerUrl, title, onClose, onSkip }: TrailerModalProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-semibold">Trailer: {title}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onSkip} size="sm">
            Skip to Watch
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Trailer */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl aspect-video rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={trailerUrl}
            title={`${title} Trailer`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};
