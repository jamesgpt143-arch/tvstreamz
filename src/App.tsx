import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";

import Index from "./pages/Index";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import LiveTV from "./pages/LiveTV";
import WatchLive from "./pages/WatchLive";
import LiveEvents from "./pages/LiveEvents";
import WatchEvent from "./pages/WatchEvent";
import Watch from "./pages/Watch";
import Search from "./pages/Search";
import MyList from "./pages/MyList";
import ContinueWatching from "./pages/ContinueWatching";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Manga from "./pages/Manga";
import MangaDetails from "./pages/MangaDetails";
import MangaReader from "./pages/MangaReader";
import ComickMangaReader from "./pages/ComickMangaReader";
import NotFound from "./pages/NotFound";
import IPTV from "./pages/IPTV";

import TempMail from "./pages/TempMail";
import TextToSpeech from "./pages/TextToSpeech";
import { BottomNav } from "./components/BottomNav";

import CustomChannels from "./pages/CustomChannels";
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { MaintenanceOverlay } from '@/components/MaintenanceOverlay';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { SEOManager } from '@/components/SEOManager';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const App = () => {
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceAndRole();
  }, []);

  const checkMaintenanceAndRole = async () => {
    try {
      // 1. Check Maintenance Setting
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "maintenance_mode")
        .maybeSingle();

      const maintenanceVal = setting?.value as any;
      if (maintenanceVal?.enabled) {
        setMaintenance(maintenanceVal);
      }

      // 2. Check User Role (for bypass)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin");

        if (roles && roles.length > 0) {
          setIsAdmin(true);
        }
      }
    } catch (error) {
      console.error("Maintenance check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  // Show maintenance overlay if enabled AND user is NOT an admin
  // We allow access TO /auth and /admin for login purposes (though /admin has its own check)
  const isAuthPage = window.location.pathname === "/auth" || window.location.pathname === "/admin";
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <SEOManager />
          <Toaster />
          <Sonner />
          
          {maintenance.enabled && !isAdmin && !isAuthPage ? (
            <MaintenanceOverlay message={maintenance.message} />
          ) : (
            <>
              <UpdatePrompt />
              <AnnouncementBar />

              <BrowserRouter>
                <div className="pb-16 md:pb-0">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/movies" element={<Movies />} />
                    <Route path="/tv-shows" element={<TVShows />} />
                    <Route path="/manga" element={<Manga />} />
                    <Route path="/manga/:mangaId" element={<MangaDetails />} />
                    <Route path="/manga/:mangaId/read/:chapterId" element={<MangaReader />} />
                    <Route path="/manga/:mangaId/read-comick/:chapterId" element={<ComickMangaReader />} />
                    <Route path="/live-tv" element={<LiveTV />} />
                    <Route path="/live-events" element={<LiveEvents />} />
                    <Route path="/live-event/*" element={<WatchEvent />} />
                    <Route path="/live/:channelId" element={<WatchLive />} />
                    <Route path="/watch/:type/:id" element={<Watch />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/my-list" element={<MyList />} />
                    <Route path="/continue-watching" element={<ContinueWatching />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/iptv" element={<IPTV />} />
                    
                    <Route path="/temp-mail" element={<TempMail />} />
                    <Route path="/text-to-speech" element={<TextToSpeech />} />
                    
                    <Route path="/custom-channels" element={<CustomChannels />} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <BottomNav />
                </div>
              </BrowserRouter>
            </>
          )}
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
