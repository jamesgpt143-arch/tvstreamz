/**
 * Cloudflare Worker - HLS/DASH Proxy for bypassing CORS
 * 
 * Deploy this to your Cloudflare account:
 * 1. Go to https://dash.cloudflare.com
 * 2. Click "Workers & Pages" in the sidebar
 * 3. Click "Create application" > "Create Worker"
 * 4. Name it (e.g., "hls-proxy")
 * 5. Replace the code with this file's content
 * 6. Click "Save and Deploy"
 * 7. Copy your worker URL (e.g., https://hls-proxy.your-subdomain.workers.dev)
 * 8. Update CLOUDFLARE_PROXY_URL in your app's environment
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Range',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const url = new URL(request.url);
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate URL
      let parsedTarget;
      try {
        parsedTarget = new URL(targetUrl);
      } catch {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build headers for the upstream request
      const upstreamHeaders = new Headers();
      
      // Check for custom User-Agent via query param
      const customUA = url.searchParams.get('ua');
      upstreamHeaders.set('User-Agent', customUA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Check for custom Cookie via query param
      const customCookie = url.searchParams.get('cookie');
      if (customCookie) {
        upstreamHeaders.set('Cookie', customCookie);
      }
      
      // Check for custom Referer via query param
      const customReferer = url.searchParams.get('referer');
      if (customReferer) {
        upstreamHeaders.set('Referer', customReferer);
      }
      
      // Forward Range header for video segments
      const rangeHeader = request.headers.get('Range');
      if (rangeHeader) {
        upstreamHeaders.set('Range', rangeHeader);
      }

      // GEOBLOCK BYPASS: Inject Philippines/India IP Headers
      const geoIPs = [
        // Philippines
        '112.204.1.10', '120.28.45.1', '49.145.23.5', 
        '180.191.102.3', '203.177.42.8', '210.213.122.5',
        // India
        '103.21.164.1', '103.232.124.1', '103.241.224.1',
        '104.211.231.1', '106.51.72.1', '115.248.114.1'
      ];
      const randomIP = geoIPs[Math.floor(Math.random() * geoIPs.length)];
      
      upstreamHeaders.set('X-Forwarded-For', randomIP);
      upstreamHeaders.set('X-Real-IP', randomIP);
      upstreamHeaders.set('True-Client-IP', randomIP);
      upstreamHeaders.set('X-Visitor-IP', randomIP);
      upstreamHeaders.set('X-Originating-IP', randomIP);
      
      // Some CDNs check these for location
      const isIndia = targetUrl.toLowerCase().includes('india');
      upstreamHeaders.set('CF-IPCountry', isIndia ? 'IN' : 'PH');

      // Fetch the resource - use manual redirect to preserve custom headers
      // Force GET to avoid 405 Method Not Allowed from strict CDNs on HEAD requests
      let response = await fetch(targetUrl, {
        method: 'GET',
        headers: upstreamHeaders,
        redirect: 'manual',
      });

      // Manually follow redirects (up to 5) to preserve custom headers
      let redirectCount = 0;
      while ([301, 302, 303, 307, 308].includes(response.status) && redirectCount < 5) {
        const location = response.headers.get('location');
        if (!location) break;
        const redirectUrl = location.startsWith('http') ? location : new URL(location, targetUrl).href;
        response = await fetch(redirectUrl, {
          method: 'GET',
          headers: upstreamHeaders,
          redirect: 'manual',
        });
        redirectCount++;
      }

      if (!response.ok && response.status !== 206) {
        return new Response(JSON.stringify({ error: `Upstream error: ${response.status}` }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Check if this is an HLS manifest
      const isManifest = targetUrl.includes('.m3u8') || 
                         contentType.includes('mpegurl') || 
                         contentType.includes('x-mpegurl');

      if (isManifest) {
        const text = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        // Build a base for sub-resources that preserves all original params (UA, Referer, etc.)
        const currentUrl = new URL(request.url);
        const subParams = new URLSearchParams(currentUrl.search);
        subParams.delete('url'); // We'll set this dynamically
        const proxyBase = `${currentUrl.origin}${currentUrl.pathname}?${subParams.toString()}${subParams.toString() ? '&' : ''}url=`;

        // Rewrite URLs in the manifest
        const rewritten = text.split('\n').map(line => {
          const trimmed = line.trim();
          
          // Skip empty lines and comments (except URI references)
          if (!trimmed || (trimmed.startsWith('#') && !trimmed.includes('URI='))) {
            // Handle URI= in EXT-X-KEY, EXT-X-MAP, etc.
            if (trimmed.includes('URI="')) {
              return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
                const fullUri = uri.startsWith('http') ? uri : baseUrl + uri;
                return `URI="${proxyBase}${encodeURIComponent(fullUri)}"`;
              });
            }
            return line;
          }
          
          // It's a URL line (segment or sub-playlist)
          if (!trimmed.startsWith('#')) {
            const fullUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
            return proxyBase + encodeURIComponent(fullUrl);
          }
          
          return line;
        }).join('\n');

        return new Response(rewritten, {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Cache-Control': 'no-cache',
          },
        });
      }

      // Check if this is a DASH manifest
      const isDash = targetUrl.includes('.mpd') || contentType.includes('dash+xml');
      
      if (isDash) {
        const text = await response.text();
        const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
        
        // Build a base for sub-resources that preserves all original params
        const currentUrl = new URL(request.url);
        const subParams = new URLSearchParams(currentUrl.search);
        subParams.delete('url');
        const proxyBase = `${currentUrl.origin}${currentUrl.pathname}?${subParams.toString()}${subParams.toString() ? '&' : ''}url=`;

        // Rewrite BaseURL and media/init URLs in MPD
        let rewritten = text;

        // MEDIAQUEST DASH FIX: If we are in a tokenized Mediaquest path, 
        // ensure absolute <BaseURL> tags don't jump to the un-tokenized 'ucdn' domain.
        if (targetUrl.includes('/bpk-token/') && targetUrl.includes('mediaquest.com.ph')) {
          const tokenMatch = targetUrl.match(/(\/bpk-token\/[^/]+\/)/);
          if (tokenMatch) {
            const tokenPart = tokenMatch[1];
            // If the manifest points to ucdn, force it back to cdnsc01 with the token
            rewritten = rewritten.replace(/<BaseURL>https:\/\/ucdn\.mediaquest\.com\.ph\/([^<]+)<\/BaseURL>/g, (match, path) => {
              const authorizedBase = `https://cdnsc01.mediaquest.com.ph${tokenPart}${path}`;
              console.log(`[Proxy] Correcting DASH BaseURL: ${authorizedBase}`);
              return `<BaseURL>${proxyBase}${encodeURIComponent(authorizedBase)}</BaseURL>`;
            });
          }
        }
        
        // Rewrite BaseURL elements
        rewritten = rewritten.replace(/<BaseURL>([^<]+)<\/BaseURL>/g, (match, url) => {
          const fullUrl = url.startsWith('http') ? url : baseUrl + url;
          return `<BaseURL>${proxyBase}${encodeURIComponent(fullUrl)}</BaseURL>`;
        });

        // Rewrite media and initialization attributes
        rewritten = rewritten.replace(/(media|initialization)="([^"]+)"/g, (match, attr, url) => {
          // Skip template URLs with $...$ placeholders
          if (url.includes('$')) return match;
          const fullUrl = url.startsWith('http') ? url : baseUrl + url;
          return `${attr}="${proxyBase}${encodeURIComponent(fullUrl)}"`;
        });

        return new Response(rewritten, {
          status: response.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/dash+xml',
            'Cache-Control': 'no-cache',
          },
        });
      }

      // For video/audio segments, stream directly
      const responseHeaders = new Headers(corsHeaders);
      responseHeaders.set('Content-Type', contentType);
      
      // Forward important headers
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        responseHeaders.set('Content-Length', contentLength);
      }
      
      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        responseHeaders.set('Content-Range', contentRange);
      }

      return new Response(response.body, {
        status: response.status,
        headers: responseHeaders,
      });

    } catch (error) {
      console.error('Proxy error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Proxy error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
