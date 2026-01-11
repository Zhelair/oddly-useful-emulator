// Cloudflare Worker: oddly-useful-house-proxy
// Fixes CORS for GitHub Pages + returns plain TEXT so the website can display it.

const ALLOWED_ORIGINS = new Set([
  "https://zhelair.github.io",
  // add your custom domains here later if you want
]);

function corsHeaders(req) {
  const origin = req.headers.get("Origin") || "";
  // If it's one of our known sites, echo it back. Otherwise allow all (safe here: no cookies).
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": req.headers.get("Access-Control-Request-Headers") || "Content-Type, Authorization, X-Passphrase",
    "Access-Control-Max-Age": "86400",
  };
}

function withCors(req, res) {
  const h = new Headers(res.headers);
  const cors = corsHeaders(req);
  for (const [k, v] of Object.entries(cors)) h.set(k, v);
  // Helpful for caches + debugging
  h.set("Vary", "Origin");
  return new Response(res.body, { status: res.status, headers: h });
}

function jsonError(req, status, message) {
  return withCors(req, new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  }));
}

function textOk(req, text) {
  return withCors(req, new Response(text || "", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  }));
}

/** Very small rate limiter using Durable Object */
export class RateLimiter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname !== "/check") return new Response("Not found", { status: 404 });

    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD
    const limit = Number(url.searchParams.get("limit") || "15");

    const data = (await this.state.storage.get(dayKey)) || { count: 0 };
    data.count += 1;

    await this.state.storage.put(dayKey, data);
    const ok = data.count <= limit;

    return new Response(JSON.stringify({ ok, count: data.count, limit }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function checkRateLimit(env, limit, bucket) {
  // Bucket MUST be stable per user/passphrase, otherwise one user burns everyone.
  const safeBucket = String(bucket || "global").slice(0, 120);
  const id = env.RATE_LIMITER.idFromName(safeBucket);
  const stub = env.RATE_LIMITER.get(id);
  const res = await stub.fetch(`https://do/check?limit=${limit}`);
  const j = await res.json();
  return j;
}

function normalizePassphrases(raw) {
  if (!raw) return [];
  // Accept "a,b,c" or "a\nb\nc"
  return String(raw)
    .split(/[\n,]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

async function deepseekPromptCheck({ apiKey, prompt }) {
  // NOTE: This is the DeepSeek OpenAI-compatible endpoint.
  const url = "https://api.deepseek.com/chat/completions";

  // Keep it cheap + stable.
  const body = {
    model: "deepseek-chat",
    messages: [
      { role: "system", content: "You are a prompt-check assistant. You DO NOT execute the task. You only improve clarity, give short suggestions, and point out missing info. Keep it concise." },
      { role: "user", content: prompt || "" },
    ],
    temperature: 0.2,
    max_tokens: 350,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const txt = await res.text();

  if (!res.ok) {
    // pass through some error to help debugging
    throw new Error(`DeepSeek error ${res.status}: ${txt.slice(0, 200)}`);
  }

  const j = JSON.parse(txt);
  const out = j?.choices?.[0]?.message?.content || "";
  return out;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return withCors(request, new Response(null, { status: 204 }));
    }

    // quick health check
    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return textOk(request, "ok");
    }

    // Accept multiple paths so old frontends don't break.
    const PROMPT_PATHS = new Set([
      "/prompt-check",              // current
      "/promptcheck",               // legacy (no hyphen)
      "/v1/oddlyuseful/promptcheck"  // legacy (versioned)
    ]);
    if (!PROMPT_PATHS.has(url.pathname)) {
      return withCors(request, new Response("Not found", { status: 404 }));
    }

    if (request.method !== "POST") {
      return jsonError(request, 405, "Use POST /prompt-check");
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return jsonError(request, 400, "Body must be JSON.");
    }

    const prompt = String(payload?.prompt || "").trim();
    const access = String(payload?.access || "included").toLowerCase(); // "included" or "mykey"
    const passphrase = String(payload?.passphrase || payload?.code || payload?.pass || "").trim();
    const dailyLimit = Number(payload?.dailyLimit || 15);

    if (!prompt) return textOk(request, ""); // website already blocks empty prompts

    // House (included) mode ALWAYS requires a Premium passphrase.
    // Store allowed passphrases in the Worker secret ALLOWED_PASSPHRASES (comma or newline separated).
    const allowed = normalizePassphrases(env.ALLOWED_PASSPHRASES);
    if (access === "included") {
      if (!passphrase) return jsonError(request, 401, "Premium passphrase required.");
      if (!allowed.length) return jsonError(request, 500, "Server missing ALLOWED_PASSPHRASES secret.");
      if (!allowed.includes(passphrase)) return jsonError(request, 401, "Premium passphrase incorrect.");
    }

    // Rate limit only for included key
    if (access === "included") {
      const rl = await checkRateLimit(env, dailyLimit, `pp:${passphrase}`);
      if (!rl.ok) {
        return jsonError(request, 429, `Daily limit reached (${rl.limit}/day).`);
      }
    }

    const apiKey =
      access === "mykey"
        ? String(payload?.apiKey || payload?.key || "")
        : String(env.DEEPSEEK_API_KEY || "");

    if (!apiKey) return jsonError(request, 500, "Missing DeepSeek API key (server side).");

    try {
      const out = await deepseekPromptCheck({ apiKey, prompt });
      // IMPORTANT: return plain text (the website expects text)
      return textOk(request, out);
    } catch (err) {
      return jsonError(request, 502, err?.message || "Upstream error");
    }
  },
};
