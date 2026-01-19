import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const ADD_TIME_URL = "https://cuty.io/LdrbJEQiJ";
const STORAGE_KEY = "site_access_token";
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

    // Store current path to return after verification
    const returnUrl = `${window.location.origin}${window.location.pathname}?add_time=true`;
    
    // Open the gateway URL
    window.location.href = ADD_TIME_URL;
  };

  // Check URL for add_time parameter and add time if present
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("add_time") === "true" && urlParams.get("verified") === "true") {
      const storedExpiry = localStorage.getItem(STORAGE_KEY);
      if (storedExpiry) {
        const currentExpiry = parseInt(storedExpiry, 10);
        const newExpiry = currentExpiry + (ADD_TIME_HOURS * 60 * 60 * 1000);
        localStorage.setItem(STORAGE_KEY, newExpiry.toString());
        
        // Remove the parameters from URL
        urlParams.delete("add_time");
        urlParams.delete("verified");
        const newSearch = urlParams.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, "", newUrl);
        
        toast.success(`Added ${ADD_TIME_HOURS} hours to your access time!`);
      }
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
