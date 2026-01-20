import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Unlock } from "lucide-react";

const GATEWAY_URL = "https://cuty.io/LdrbJEQiJ";
const PENDING_TOKEN_KEY = "site_pending_token";
const STORAGE_KEY = "site_access_token";

interface GatekeeperProps {
  children: React.ReactNode;
}

export const Gatekeeper = ({ children }: GatekeeperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [showGatewayDialog, setShowGatewayDialog] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Check URL params directly from window.location for reliability
      const urlParams = new URLSearchParams(window.location.search);
      const hasVerifiedParam = urlParams.get("verified") === "true";
      
      // Check if there's a pending token (user clicked Unlock button before)
      const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);

      if (hasVerifiedParam && pendingToken) {
        // Valid verification - user clicked Unlock and completed gateway
        // Remove the pending token
        localStorage.removeItem(PENDING_TOKEN_KEY);
        
        // Check if user already has existing time and add 3 hours to it
        const existingExpiry = localStorage.getItem(STORAGE_KEY);
        let newExpiryTime: number;
        
        if (existingExpiry) {
          const currentExpiry = parseInt(existingExpiry, 10);
          // If current expiry is still in the future, add 3 hours to it
          if (currentExpiry > Date.now()) {
            newExpiryTime = currentExpiry + 3 * 60 * 60 * 1000;
          } else {
            // Expired, start fresh with 3 hours from now
            newExpiryTime = Date.now() + 3 * 60 * 60 * 1000;
          }
        } else {
          // No existing token, set 3 hours from now
          newExpiryTime = Date.now() + 3 * 60 * 60 * 1000;
        }
        
        localStorage.setItem(STORAGE_KEY, newExpiryTime.toString());

        // Remove the ?verified=true parameter from URL
        urlParams.delete("verified");
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);

        setIsVerified(true);
        setShowGatewayDialog(false);
        return;
      } else if (hasVerifiedParam && !pendingToken) {
        // Someone tried to bypass by typing URL directly - remove the param
        urlParams.delete("verified");
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);
      }

      // Check localStorage for existing valid token
      const storedExpiry = localStorage.getItem(STORAGE_KEY);
      
      if (storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (Date.now() < expiryTime) {
          setIsVerified(true);
          setShowGatewayDialog(false);
          return;
        }
        // Token expired, remove it
        localStorage.removeItem(STORAGE_KEY);
      }

      // Check if user is an admin (bypass gateway)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        
        if (isAdmin) {
          setIsVerified(true);
          setShowGatewayDialog(false);
          return;
        }
      }

      // No valid token, show gateway dialog
      setShowGatewayDialog(true);
      setIsVerified(false);
    };

    checkAccess();
  }, [location.pathname, location.search]);

  const handleUnlockClick = () => {
    // Generate a unique pending token before redirecting
    const pendingToken = Date.now().toString() + Math.random().toString(36).substring(2);
    localStorage.setItem(PENDING_TOKEN_KEY, pendingToken);
    
    // Open the gateway URL in the same tab
    window.location.href = GATEWAY_URL;
  };

  // Show nothing while checking verification
  if (isVerified === null) {
    return null;
  }

  // Show gateway dialog if not verified
  if (!isVerified && showGatewayDialog) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Unlock className="h-5 w-5 text-primary" />
                Unlock Access
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                To access TVStreamz and enjoy unlimited streaming of movies, TV shows, anime, and live TV, please complete a quick verification.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 pt-4">
              <Button 
                onClick={handleUnlockClick} 
                className="w-full gap-2"
                size="lg"
              >
                <ExternalLink className="h-4 w-4" />
                Unlock Now
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                💡 Tip: Use <a href="https://brave.com/download/" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:no-underline">Brave Browser</a> for a better ad-free experience!
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return <>{children}</>;
};
