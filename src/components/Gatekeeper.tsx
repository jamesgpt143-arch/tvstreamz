import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const GATEWAY_URL = "https://cuty.io/DpgGd";
const STORAGE_KEY = "site_access_token";

interface GatekeeperProps {
  children: React.ReactNode;
}

export const Gatekeeper = ({ children }: GatekeeperProps) => {
  const location = useLocation();
  const [isVerified, setIsVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      // First, check if user is an admin (bypass gateway)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data: isAdmin } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        
        if (isAdmin) {
          setIsVerified(true);
          return;
        }
      }

      const searchParams = new URLSearchParams(location.search);
      const hasVerifiedParam = searchParams.get("verified") === "true";

      if (hasVerifiedParam) {
        // Calculate expiry time (6 hours from now)
        const expiryTime = Date.now() + 6 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, expiryTime.toString());

        // Remove the ?verified=true parameter from URL
        searchParams.delete("verified");
        const newSearch = searchParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);

        setIsVerified(true);
        return;
      }

      // Check localStorage for existing valid token
      const storedExpiry = localStorage.getItem(STORAGE_KEY);
      
      if (storedExpiry) {
        const expiryTime = parseInt(storedExpiry, 10);
        if (Date.now() < expiryTime) {
          setIsVerified(true);
          return;
        }
        // Token expired, remove it
        localStorage.removeItem(STORAGE_KEY);
      }

      // No valid token, redirect to gateway
      window.location.href = GATEWAY_URL;
    };

    checkAccess();
  }, [location.search]);

  // Show nothing while checking verification
  if (isVerified === null) {
    return null;
  }

  return <>{children}</>;
};
