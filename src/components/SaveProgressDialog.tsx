import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark } from 'lucide-react';

interface SaveProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (hours: number, minutes: number, seconds: number) => void;
  currentTime?: number; // in seconds
  duration?: number; // in seconds
}

export const SaveProgressDialog = ({
  open,
  onOpenChange,
  onSave,
  currentTime = 0,
  duration = 0,
}: SaveProgressDialogProps) => {
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [seconds, setSeconds] = useState('0');

  // Initialize with current saved time
  useEffect(() => {
    if (open && currentTime > 0) {
      const h = Math.floor(currentTime / 3600);
      const m = Math.floor((currentTime % 3600) / 60);
      const s = Math.floor(currentTime % 60);
      setHours(h.toString());
      setMinutes(m.toString());
      setSeconds(s.toString());
    } else if (open) {
      setHours('0');
      setMinutes('0');
      setSeconds('0');
    }
  }, [open, currentTime]);

  const handleSave = () => {
    const h = Math.max(0, parseInt(hours) || 0);
    const m = Math.max(0, Math.min(59, parseInt(minutes) || 0));
    const s = Math.max(0, Math.min(59, parseInt(seconds) || 0));
    onSave(h, m, s);
  };

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) {
      return `${h}h ${m}m`;
    }
    return `${m}m`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[350px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-primary" />
            Save Progress
          </DialogTitle>
          <DialogDescription>
            Enter the timestamp where you stopped watching.
            {duration > 0 && (
              <span className="block mt-1 text-xs">
                Total duration: {formatDuration(duration)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          <div className="space-y-2">
            <Label htmlFor="hours" className="text-center block">Hours</Label>
            <Input
              id="hours"
              type="number"
              min="0"
              max="99"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className="text-center text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minutes" className="text-center block">Minutes</Label>
            <Input
              id="minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="text-center text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="seconds" className="text-center block">Seconds</Label>
            <Input
              id="seconds"
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={(e) => setSeconds(e.target.value)}
              className="text-center text-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Progress
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
