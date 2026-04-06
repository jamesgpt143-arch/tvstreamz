import { HardHat, AlertTriangle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface MaintenanceOverlayProps {
  message?: string;
}

export function MaintenanceOverlay({ message }: MaintenanceOverlayProps) {
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-0 right-0 p-4">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
          <Link to="/auth">
            <LogIn className="h-4 w-4" /> Admin Login
          </Link>
        </Button>
      </div>

      <div className="relative mb-8">
        <div className="absolute -inset-4 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
        <HardHat className="h-16 w-16 text-orange-500 relative" />
      </div>

      <h1 className="text-3xl font-bold mb-4 tracking-tight">Site Under Maintenance</h1>
      <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
        {message || "We are currently performing scheduled maintenance to improve our services. Please check back later."}
      </p>

      <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full border border-border text-xs text-muted-foreground">
        <AlertTriangle className="h-3 w-3 text-orange-500" />
        Estimated time of return: Soon
      </div>

      <div className="mt-12 text-[10px] text-muted-foreground uppercase tracking-widest opacity-30 font-bold">
        TVStreamz Platform
      </div>
    </div>
  );
}
