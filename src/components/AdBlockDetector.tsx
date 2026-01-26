import { useState, useEffect } from 'react';
import { AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const AdBlockDetector = () => {
  const [adBlockDetected, setAdBlockDetected] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const detectAdBlock = async () => {
      try {
        // Method 1: Try to fetch a common ad script URL (will be blocked by adblockers)
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ad-placement ad-banner textAd banner-ad';
        testAd.style.cssText = 'position: absolute; top: -999px; left: -999px; width: 1px; height: 1px;';
        document.body.appendChild(testAd);

        // Wait a bit for adblockers to process
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if the element was hidden/removed by an adblocker
        const isBlocked = testAd.offsetHeight === 0 || 
                          testAd.offsetWidth === 0 || 
                          testAd.clientHeight === 0 ||
                          getComputedStyle(testAd).display === 'none' ||
                          getComputedStyle(testAd).visibility === 'hidden';

        document.body.removeChild(testAd);

        // Method 2: Check if our ad-proxy script was loaded
        const scripts = document.querySelectorAll('script[src*="ad-proxy"]');
        let scriptBlocked = false;
        
        if (scripts.length > 0) {
          // Check if the script actually loaded content
          try {
            const response = await fetch('/api/ad-proxy', { method: 'HEAD' });
            scriptBlocked = !response.ok;
          } catch {
            scriptBlocked = true;
          }
        }

        // Method 3: Check for common adblock indicators
        const baitElement = document.createElement('div');
        baitElement.id = 'ad-container';
        baitElement.className = 'ad ads adsbox doubleclick ad-placement ad-placeholder adbadge';
        baitElement.style.cssText = 'height: 1px !important; width: 1px !important; position: absolute !important; left: -10000px !important; top: -10000px !important;';
        document.body.appendChild(baitElement);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const baitBlocked = baitElement.offsetParent === null || 
                           baitElement.offsetHeight === 0 || 
                           baitElement.offsetWidth === 0;
        
        document.body.removeChild(baitElement);

        setAdBlockDetected(isBlocked || scriptBlocked || baitBlocked);
      } catch (error) {
        console.error('AdBlock detection error:', error);
        setAdBlockDetected(false);
      } finally {
        setChecking(false);
      }
    };

    detectAdBlock();
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  if (checking) {
    return null;
  }

  if (!adBlockDetected) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="max-w-md mx-4 p-8 bg-gradient-to-br from-destructive/20 to-background border border-destructive/30 rounded-2xl shadow-2xl text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/20 flex items-center justify-center">
          <Shield className="w-10 h-10 text-destructive" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Ad Blocker Detected
        </h2>
        
        <div className="flex items-start gap-3 p-4 bg-accent/50 border border-accent rounded-lg mb-6">
          <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/90 text-left">
            Para makapanood, i-disable muna ang iyong ad blocker at i-refresh ang page.
          </p>
        </div>
        
        <p className="text-muted-foreground text-sm mb-6">
          Ang aming site ay supported ng ads. Mangyaring i-whitelist ang site na ito o i-disable ang ad blocker para makapag-access.
        </p>
        
        <div className="space-y-3">
          <Button 
            onClick={handleRefresh}
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            I-refresh ang Page
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Kapag na-disable mo na ang ad blocker, i-click ang button sa taas.
          </p>
        </div>
      </div>
    </div>
  );
};
