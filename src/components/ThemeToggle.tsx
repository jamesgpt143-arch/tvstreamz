import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative w-14 h-7 rounded-full transition-colors duration-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, hsl(220 20% 15%), hsl(240 20% 25%))'
          : 'linear-gradient(135deg, hsl(200 80% 70%), hsl(40 90% 70%))',
      }}
      aria-label="Toggle theme"
    >
      {/* Stars (visible in dark mode) */}
      <span
        className="absolute top-1.5 left-2 w-1 h-1 rounded-full bg-white/80 transition-opacity duration-500"
        style={{ opacity: isDark ? 1 : 0 }}
      />
      <span
        className="absolute top-3 left-5 w-0.5 h-0.5 rounded-full bg-white/60 transition-opacity duration-500"
        style={{ opacity: isDark ? 1 : 0 }}
      />
      <span
        className="absolute bottom-2 left-3 w-0.5 h-0.5 rounded-full bg-white/50 transition-opacity duration-500"
        style={{ opacity: isDark ? 1 : 0 }}
      />

      {/* Clouds (visible in light mode) */}
      <span
        className="absolute bottom-1 right-2 w-3 h-1.5 rounded-full bg-white/60 transition-opacity duration-500"
        style={{ opacity: isDark ? 0 : 1 }}
      />
      <span
        className="absolute bottom-1.5 right-4 w-2 h-1 rounded-full bg-white/40 transition-opacity duration-500"
        style={{ opacity: isDark ? 0 : 1 }}
      />

      {/* Toggle knob */}
      <span
        className="absolute top-0.5 flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-all duration-500 ease-in-out"
        style={{
          left: isDark ? 'calc(100% - 1.625rem)' : '0.125rem',
          background: isDark
            ? 'linear-gradient(135deg, hsl(45 10% 85%), hsl(45 10% 75%))'
            : 'linear-gradient(135deg, hsl(45 100% 60%), hsl(35 100% 50%))',
          boxShadow: isDark
            ? '0 0 8px hsl(45 10% 85% / 0.4)'
            : '0 0 12px hsl(45 100% 60% / 0.6)',
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-slate-600 transition-transform duration-500 rotate-0" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-800 transition-transform duration-500 rotate-0" />
        )}
      </span>
    </button>
  );
}
