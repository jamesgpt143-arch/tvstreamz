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

      // Fetch the resource
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: upstreamHeaders,
        redirect: 'follow',
      });

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
        const proxyBase = `${url.origin}${url.pathname}?url=`;

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
        const proxyBase = `${url.origin}${url.pathname}?url=`;

        // Rewrite BaseURL and media/init URLs in MPD
        let rewritten = text;
        
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
