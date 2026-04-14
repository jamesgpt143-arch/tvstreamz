import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Manga from "./pages/Manga";
import MangaDetails from "./pages/MangaDetails";
import MangaReader from "./pages/MangaReader";
import ComickMangaReader from "./pages/ComickMangaReader";
import NotFound from "./pages/NotFound";
import IPTV from "./pages/IPTV";
import PlaylistPlayer from "./pages/PlaylistPlayer";


import TempMail from "./pages/TempMail";
import TextToSpeech from "./pages/TextToSpeech";
import { BottomNav } from "./components/BottomNav";

import CustomChannels from "./pages/CustomChannels";
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { MaintenanceOverlay } from '@/components/MaintenanceOverlay';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { SEOManager } from '@/components/SEOManager';
import { useState, useEffect } from "react";
import { useLocation, BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// High-level wrapper to handle route-based maintenance bypass
const MaintenanceWrapper = ({ maintenance, isAdmin, children }: {
  maintenance: { enabled: boolean; message: string };
  isAdmin: boolean;
  children: React.ReactNode
}) => {
  const location = useLocation();
  // Bypass maintenance overlay only for /auth and /admin
  const isAuthPage = location.pathname === "/auth" || location.pathname === "/admin";

  if (maintenance.enabled && !isAdmin && !isAuthPage) {
    return <MaintenanceOverlay message={maintenance.message} />;
  }

  return <>{children}</>;
};

import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";

// ... other imports

const App = () => {
  // ... state and effects

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
        <BrowserRouter>
          <MaintenanceWrapper maintenance={maintenance} isAdmin={isAdmin}>
            <TooltipProvider>
              <UserPreferencesProvider>
                <SEOManager />
                <Toaster />
                <Sonner />
                <UpdatePrompt />
                <AnnouncementBar />

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
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/iptv" element={<IPTV />} />
                    <Route path="/temp-mail" element={<TempMail />} />
                    <Route path="/text-to-speech" element={<TextToSpeech />} />
                    <Route path="/custom-channels" element={<CustomChannels />} />
                    <Route path="/playlist-player" element={<PlaylistPlayer />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <BottomNav />
                </div>
              </UserPreferencesProvider>
            </TooltipProvider>
          </MaintenanceWrapper>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
