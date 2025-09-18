// Deno Supabase Edge Function: ai-chat
// Proxies chat requests to OpenRouter without exposing the API key to the client

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatBody {
  model?: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const DEFAULT_MODEL = "deepseek/deepseek-r1:free";

// Allow calls from your GitHub Pages site and local dev
const ALLOWED_ORIGINS = new Set([
  "https://ongani3.github.io",
  "http://localhost:5173",
  "http://localhost:8080",
]);

function corsHeaders(origin: string | null) {
  const allowOrigin = origin && ALLOWED_ORIGINS.has(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }

  if (!OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set" }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  }

  try {
    const body = (await req.json()) as ChatBody;
    if (!body?.messages?.length) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "ongani3.github.io",
        "X-Title": "Simple CRM",
      },
      body: JSON.stringify({
        model: body.model || DEFAULT_MODEL,
        messages: body.messages,
        temperature: body.temperature ?? 0.6,
        max_tokens: body.max_tokens ?? 512,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: "Upstream error", details: text }), {
        status: 502,
        headers: { "content-type": "application/json", ...corsHeaders(origin) },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "content-type": "application/json", ...corsHeaders(origin) },
    });
  }
});


