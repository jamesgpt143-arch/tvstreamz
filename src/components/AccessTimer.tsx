import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const STORAGE_KEY = "site_access_token";

export const AccessTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const storedExpiry = localStorage.getItem(STORAGE_KEY);
      
      if (!storedExpiry) {
        setTimeRemaining(null);
        return;
      }

      const expiryTime = parseInt(storedExpiry, 10);
      const now = Date.now();
      const diff = expiryTime - now;

      if (diff <= 0) {
        setTimeRemaining(null);
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining({ hours, minutes, seconds });
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeRemaining) return null;

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
      <Clock className="w-3.5 h-3.5 text-accent" />
      <span className="text-xs font-mono font-semibold text-accent tabular-nums">
        {formatNumber(timeRemaining.hours)}:{formatNumber(timeRemaining.minutes)}:{formatNumber(timeRemaining.seconds)}
      </span>
      <span className="text-[10px] text-muted-foreground hidden sm:inline">left</span>
    </div>
  );
};
