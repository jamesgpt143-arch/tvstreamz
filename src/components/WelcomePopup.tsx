import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const WelcomePopup = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if the popup has been shown before
    const hasSeenPopup = sessionStorage.getItem("hasSeenWelcomePopup");
    if (!hasSeenPopup) {
      // Small delay to make it feel less intrusive on immediate load
      const timer = setTimeout(() => {
        setOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      sessionStorage.setItem("hasSeenWelcomePopup", "true");
    }
  };

  const handleBannerClick = () => {
    sessionStorage.setItem("hasSeenWelcomePopup", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden bg-transparent border-none shadow-none">
        <a 
          href="https://luckywatch.pro/u/oatno" 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleBannerClick}
          className="block w-full h-full relative group cursor-pointer"
        >
          {/* Replace this src with the actual path to the uploaded image if you save it to public/ folder */}
          <img 
            src="/lucky-watch-banner.jpg" 
            alt="Lucky Watch - Watch Videos and Earn Money" 
            className="w-full h-auto rounded-lg shadow-2xl object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            onError={(e) => {
              // Fallback if image is not yet uploaded
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          
          {/* Fallback content if image fails to load */}
          <div className="hidden w-full aspect-[2/3] bg-[#0b0c10] border border-zinc-800 rounded-lg flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-cover bg-center" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?q=80&w=600&auto=format&fit=crop")'}}>
            <div className="absolute inset-0 bg-black/60 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
            
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-between py-4">
              <div className="flex items-center gap-2 self-start mb-auto">
                <div className="w-8 h-8 bg-[#c4ff2b] rounded-full flex items-center justify-center text-black font-bold text-xl">
                  ♣
                </div>
                <span className="text-white font-bold tracking-wider">LUCKY WATCH</span>
              </div>
              
              <div className="mt-auto w-full mb-6">
                <h2 className="text-white text-3xl font-black uppercase mb-3 leading-tight text-left">
                  Watch Videos<br />and <span className="text-[#c4ff2b]">Earn Money</span>
                </h2>
                
                <p className="text-gray-300 text-base text-left mb-6 font-medium">
                  Without investments<br />and any skills.
                </p>
                
                <button className="w-full bg-[#c4ff2b] hover:bg-[#aee615] text-black font-bold py-3 px-8 rounded-full text-lg transition-colors">
                  START
                </button>
              </div>
            </div>
          </div>
        </a>
      </DialogContent>
    </Dialog>
  );
};
