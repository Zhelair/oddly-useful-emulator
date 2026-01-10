export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/rate") {
      return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
    }
    const { dateKey, limit } = await request.json();
    const key = `count:${dateKey}`;
    let count = (await this.state.storage.get(key)) || 0;
    count += 1;
    await this.state.storage.put(key, count);
    const remaining = Math.max(0, (Number(limit) || 15) - count);
    return Response.json({ count, remaining });
  }
}

const PROMPT_CHECK_SYSTEM = [
  "You are an expert AI prompt reviewer and teacher.",
  "",
  "Your task is NOT to execute the user’s request.",
  "Your task is to analyze the quality of the prompt itself.",
  "",
  "Behave like a calm, precise mentor.",
  "Never judge the user.",
  "Never mock the prompt.",
  "Never add unnecessary verbosity.",
  "",
  "Follow this process exactly:",
  "",
  "1) Diagnose how an AI model would likely interpret the prompt.",
  "   - Identify ambiguity, missing context, conflicting instructions, or hidden assumptions.",
  "   - Be factual and concise.",
  "",
  "2) Identify what information is missing or under-specified.",
  "   - Examples: goal, audience, format, constraints, success criteria.",
  "   - Do not invent requirements. Only suggest what would improve clarity.",
  "",
  "3) Suggest concrete improvements.",
  "   - Use actionable language (“Clarify X”, “Specify Y”).",
  "   - Avoid abstract theory.",
  "",
  "4) Produce a revised “Golden Prompt”.",
  "   - Preserve the user’s original intent.",
  "   - Remove ambiguity.",
  "   - Separate planning from execution if relevant.",
  "   - Do NOT add new goals or features.",
  "",
  "Rules:",
  "- Do not execute the task described in the prompt.",
  "- Do not provide final answers to the task itself.",
  "- Do not lecture.",
  "- Do not over-explain.",
  "- If the prompt is already strong, explicitly say so.",
  "",
  "Tone:",
  "- Calm",
  "- Neutral",
  "- Teacher-like",
  "- Respectful",
  "",
  "Output structure must be exactly:",
  "",
  "Diagnosis:",
  "- bullet points",
  "",
  "What’s missing:",
  "- bullet points (or “Nothing critical missing”)",
  "",
  "Suggested improvements:",
  "- bullet points",
  "",
  "Golden Prompt:",
  "- a single, clean prompt block"
];

const ALLOWED_ORIGINS = [
  "https://zhelair.github.io",
  "http://localhost:8787",
  "http://127.0.0.1:8787"
];

function corsHeaders(origin) {
  const o = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-OU-PASS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function jsonWithCors(data, origin, init = {}) {
  const headers = { ...(init.headers || {}), ...corsHeaders(origin) };
  return Response.json(data, { ...init, headers });
}

function sofiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Sofia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function wordCount(s) {
  const m = String(s || "").trim().match(/\S+/g);
  return m ? m.length : 0;
}

async function deepseekChat({ apiKey, model, prompt }) {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model || "deepseek-chat",
      messages: [
        { role: "system", content: PROMPT_CHECK_SYSTEM.join("\n") },
        { role: "user", content: String(prompt || "") }
      ],
      temperature: 0.2
    })
  });

  if (!res.ok) {
    const txt = await res.text();
    return { ok: false, error: `DeepSeek error: ${txt.slice(0, 200)}` };
  }
  const j = await res.json();
  const text = j?.choices?.[0]?.message?.content || "";
  return { ok: true, text };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    

    const origin = request.headers.get("Origin") || "";

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
if (url.pathname === "/prompt-check" && request.method === "POST") {
      const pass = request.headers.get("X-OU-PASS") || "";
      const allowed = String(env.ALLOWED_PASSPHRASES || "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      if (!allowed.length || !allowed.includes(pass)) {
        return jsonWithCors({ error: "Access denied. Check your passphrase." }, { status: 401 });
      }

      const dailyLimit = Number(env.DAILY_LIMIT || 15);
      const maxWords = Number(env.MAX_WORDS || 2000);

      let body = {};
      try { body = await request.json(); } catch (e) { body = {}; }

      const prompt = String(body.prompt || "").trim();
      const model = String(body.model || "deepseek-chat").trim();

      if (!prompt) return jsonWithCors({ error: "There’s nothing to review yet. Paste a prompt to begin." }, { status: 400 });

      const wc = wordCount(prompt);
      if (wc > maxWords) {
        return jsonWithCors({ error: `This prompt is too long (${wc} words). Max is ${maxWords} words.` }, { status: 400 });
      }

      // rate limit per passphrase
      const id = env.RATE_LIMITER.idFromName(pass);
      const stub = env.RATE_LIMITER.get(id);
      const dateKey = sofiaDateKey();
      const rl = await stub.fetch(new Request("https://rate.local/rate", {
        method: "POST",
        body: JSON.stringify({ dateKey, limit: dailyLimit })
      }));
      const rlJson = await rl.json();

      if ((rlJson.count || 0) > dailyLimit) {
        return jsonWithCors({ error: "Daily limit reached. This resets at 00:00 Sofia." }, { status: 429 });
      }

      const apiKey = env.DEEPSEEK_API_KEY;
      if (!apiKey) return jsonWithCors({ error: "Server is missing DEEPSEEK_API_KEY." }, { status: 500 });

      const out = await deepseekChat({ apiKey, model, prompt });
      if (!out.ok) return jsonWithCors({ error: out.error || "The model didn’t respond this time. Try again later." }, { status: 502 });

      return jsonWithCors({ text: out.text });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders(origin) });
  }
};