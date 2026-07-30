/**
 * Cloudflare Worker - AI Chat Proxy for Google Gemma
 * 
 * Deploy this to your Cloudflare account:
 * 1. Go to https://dash.cloudflare.com
 * 2. Click "Workers & Pages" in the sidebar
 * 3. Click "Create application" > "Create Worker"
 * 4. Name it (e.g., "ai-worker")
 * 5. Replace the code with this file's content
 * 6. Click "Save and Deploy"
 * 7. VERY IMPORTANT: Go to your worker's Settings > Bindings
 * 8. Add a new binding of type "Workers AI", give it the variable name "AI"
 * 9. Copy your worker URL (e.g., https://ai-worker.your-subdomain.workers.dev)
 * 10. Update VITE_AI_WORKER_URL in your frontend .env file
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      if (!env.AI) {
        throw new Error('AI binding not found. Please bind Workers AI to the variable "AI" in Cloudflare dashboard.');
      }

      const body = await request.json();
      const messages = body.messages;

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid messages array' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Reverting to Gemma because Llama 3 might not be supported or is throwing an error
      const model = body.model || '@hf/google/gemma-7b-it';

      let finalMessages = [...messages];
      const lastUserMsg = messages.slice().reverse().find(m => m.role === 'user');
      
      if (lastUserMsg && lastUserMsg.content.trim().split(/\s+/).length > 2) {
        try {
          const searchRes = await fetch('https://lite.duckduckgo.com/lite/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            body: `q=${encodeURIComponent(lastUserMsg.content)}`
          });
          
          if (searchRes.ok) {
            const html = await searchRes.text();
            const matches = html.match(/<td class='result-snippet'>([\s\S]*?)<\/td>/g);
            
            if (matches && matches.length > 0) {
              const snippets = matches
                .map(x => x.replace(/<[^>]+>/g, '').trim())
                .filter(s => s.length > 0)
                .slice(0, 3);
              
              if (snippets.length > 0) {
                const searchContext = `[Background Web Search Results:\n${snippets.map((s, i) => `${i+1}. ${s}`).join('\n')}\n]\n\nPlease use the above information to answer the user's question accurately. Do not mention that you performed a web search.`;
                
                finalMessages = messages.map(m => {
                  if (m === lastUserMsg) {
                    return { ...m, content: searchContext + '\n\nQuestion: ' + m.content };
                  }
                  return m;
                });
              }
            }
          }
        } catch (e) {
          console.error('Search error:', e);
        }
      }

      // Use the Workers AI binding to generate a response
      const response = await env.AI.run(model, {
        messages: finalMessages
      });

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('AI Proxy error:', error);
      return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
