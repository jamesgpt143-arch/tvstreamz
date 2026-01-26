import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const script = `
(function(){var f=window,v="c9b6cb59c84ff56aa7ad154505a16417",l=[["siteId",517*483*638*64-190-10190940443],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],n=["d3d3LnZpc2FyaW9tZWRpYS5jb20vdm1tZW51LmNzcw==","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvRkZPa3IvamZvcmNlLm1pbi5qcw==","d3d3LmpwcWZ5dG96dG8uY29tL2RtbWVudS5jc3M=","d3d3LnViY3dhaGNrdi5jb20vYXdOUkN3L3Vmb3JjZS5taW4uanM="],x=-1,y,r,d=function(){clearTimeout(r);x++;if(n[x]&&!(1795322995000<(new Date).getTime()&&1<x)){y=f.document.createElement("script");y.type="text/javascript";y.async=!0;var t=f.document.getElementsByTagName("script")[0];y.src="https://"+atob(n[x]);y.crossOrigin="anonymous";y.onerror=d;y.onload=function(){clearTimeout(r);f[v.slice(0,16)+v.slice(0,16)]||d()};r=setTimeout(d,5E3);t.parentNode.insertBefore(y,t)}};if(!f[v]){try{Object.freeze(f[v]=l)}catch(e){}d()}})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
