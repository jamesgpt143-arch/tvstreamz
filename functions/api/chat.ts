export const onRequestPost: PagesFunction<any> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Map messages for Cloudflare Workers AI (text only)
    const formattedMessages = body.messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : (msg.content[0]?.text || '')
    }));

    // Add system instruction
    const apiMessages = [
      { role: 'system', content: 'You are Streamz AI, a helpful assistant for TVStreamz. Answer in Tagalog if spoken to in Tagalog.' },
      ...formattedMessages
    ];

    // Call Cloudflare Workers AI (Google Gemma)
    const response = await env.AI.run('@cf/google/gemma-7b-it-lora', {
      messages: apiMessages
    });

    const formattedResponse = {
      content: [
        { text: response.response }
      ]
    };
    
    return new Response(JSON.stringify(formattedResponse), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: "Internal Server Error", details: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
