import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";

import { UnifiedPlayerProvider } from "./contexts/UnifiedPlayerContext";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import PlaylistPlayer from "./pages/PlaylistPlayer";
import NotFound from "./pages/NotFound";

import TempMail from "./pages/TempMail";
import TextToSpeech from "./pages/TextToSpeech";

import CustomChannels from "./pages/CustomChannels";
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { MaintenanceOverlay } from '@/components/MaintenanceOverlay';
import { AnnouncementBar } from '@/components/AnnouncementBar';
import { SEOManager } from '@/components/SEOManager';
import { useState, useEffect } from "react";
import { useLocation, BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

const App = () => {
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safety timeout to prevent infinite loading screen
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 4000);

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
        clearTimeout(timeout);
      }
    };

    checkMaintenanceAndRole();
    
    return () => clearTimeout(timeout);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: '#0b0b0b', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 99999,
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '3px solid rgba(255,255,255,0.1)', 
            borderTopColor: '#f97316', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px auto'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.1em', opacity: 0.6 }}>INITIALIZING...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
        <BrowserRouter>
          <UnifiedPlayerProvider>
            <MaintenanceWrapper maintenance={maintenance} isAdmin={isAdmin}>
              <TooltipProvider>
                <SEOManager />
                <Toaster />
                <Sonner />
                <UpdatePrompt />
                <AnnouncementBar />
                
                <div className="min-h-screen bg-black">
                  <Routes>
                    <Route path="/" element={<Index />} />
                    
                    {/* Redirecting discovery routes to main consolidated index */}
                    <Route path="/movies" element={<Navigate to="/" replace />} />
                    <Route path="/tv-shows" element={<Navigate to="/" replace />} />
                    <Route path="/live-tv" element={<Navigate to="/" replace />} />
                    <Route path="/search" element={<Navigate to="/" replace />} />
                    <Route path="/my-list" element={<Navigate to="/" replace />} />
                    <Route path="/iptv" element={<Navigate to="/" replace />} />
                    
                    {/* Utility Routes */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/playlist-player" element={<PlaylistPlayer />} />
                    <Route path="/temp-mail" element={<TempMail />} />
                    <Route path="/text-to-speech" element={<TextToSpeech />} />
                    <Route path="/custom-channels" element={<CustomChannels />} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </TooltipProvider>
            </MaintenanceWrapper>
          </UnifiedPlayerProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
