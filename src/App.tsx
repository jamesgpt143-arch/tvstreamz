import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import Anime from "./pages/Anime";
import LiveTV from "./pages/LiveTV";
import WatchLive from "./pages/WatchLive";
import Watch from "./pages/Watch";
import Search from "./pages/Search";

import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { FloatingChat } from "./components/FloatingChat";
import { BottomNav } from "./components/BottomNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/anime" element={<Anime />} />
              <Route path="/live-tv" element={<LiveTV />} />
              <Route path="/live/:channelId" element={<WatchLive />} />
              <Route path="/watch/:type/:id" element={<Watch />} />
              <Route path="/search" element={<Search />} />
              
              <Route path="/auth" element={<Auth />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
          <FloatingChat />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
