export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const { request, env } = context;
    const body = await request.json();

    // Make sure we have the auth token from environment variables
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing API Key configuration. Please set GEMINI_API_KEY in Cloudflare." }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Gemini requires the conversation to start with a 'user' role.
    // Let's drop any leading 'assistant' messages.
    let startIndex = 0;
    while (startIndex < body.messages.length && body.messages[startIndex].role === 'assistant') {
      startIndex++;
    }

    const validMessages = body.messages.slice(startIndex);

    const formattedContents = validMessages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const geminiPayload = {
      systemInstruction: {
        parts: [{ text: "You are Streamz AI, a helpful, friendly, and knowledgeable assistant for the TVStreamz streaming platform. You help users find movies, TV shows, and answer general questions." }]
      },
      contents: formattedContents,
      generationConfig: {
        maxOutputTokens: 1024,
      }
    };

    // Call Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "Upstream API error", details: errorText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    const data = await response.json();
    
    // Extract the text from Gemini response
    let responseText = "";
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
      responseText = data.candidates[0].content.parts[0].text;
    } else {
      responseText = "Sorry, I couldn't generate a response.";
    }

    // Map the response back to the format the frontend expects (Claude/OpenAI style)
    const formattedResponse = {
      content: [
        { text: responseText }
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
