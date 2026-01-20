import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ADD_TIME_URL = "https://cuty.io/LdrbJEQiJ";
const STORAGE_KEY = "site_access_token";
const PENDING_TOKEN_KEY = "site_pending_token";
const ADD_TIME_HOURS = 3;

export const AddTimeButton = () => {
  const [isAdding, setIsAdding] = useState(false);

  // Check if user has existing access
  const hasAccess = () => {
    const storedExpiry = localStorage.getItem(STORAGE_KEY);
    if (storedExpiry) {
      const expiryTime = parseInt(storedExpiry, 10);
      return Date.now() < expiryTime;
    }
    return false;
  };

  const handleAddTime = () => {
    if (!hasAccess()) {
      toast.error("You need to unlock access first!");
      return;
    }

    // Generate a unique pending token before redirecting
    const pendingToken = Date.now().toString() + Math.random().toString(36).substring(2);
    localStorage.setItem(PENDING_TOKEN_KEY, pendingToken);
    
    // Open the gateway URL
    window.location.href = ADD_TIME_URL;
  };

  // Check URL for verified parameter and add time if pending token exists
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const pendingToken = localStorage.getItem(PENDING_TOKEN_KEY);
    
    if (urlParams.get("verified") === "true" && pendingToken) {
      // Valid verification - user clicked Add Time and completed gateway
      localStorage.removeItem(PENDING_TOKEN_KEY);
      
      const storedExpiry = localStorage.getItem(STORAGE_KEY);
      if (storedExpiry) {
        const currentExpiry = parseInt(storedExpiry, 10);
        const newExpiry = currentExpiry + (ADD_TIME_HOURS * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEY, newExpiry.toString());
        
        toast.success(`Added ${ADD_TIME_HOURS} hours to your access time!`);
      }
      
      // Remove the verified parameter from URL
      urlParams.delete("verified");
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }

  if (!hasAccess()) {
    return null;
  }

  return (
    <Button
      onClick={handleAddTime}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <Clock className="h-4 w-4" />
      Add 3 Hours
    </Button>
  );
};
