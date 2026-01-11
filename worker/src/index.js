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


function fnv1a32(str) {
  // Simple stable hash to keep Durable Object names short and safe.
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return ("00000000" + h.toString(16)).slice(-8);
}

async function checkRateLimit(env, limit, passphrase) {
  const key = "pp:" + fnv1a32(String(passphrase || "").trim());
  const id = env.RATE_LIMITER.idFromName(key);
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

    if (url.pathname !== "/prompt-check") {
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
    const headerPass = (request.headers.get("X-Passphrase") || request.headers.get("X-OU-PASS") || request.headers.get("x-ou-pass") || "").trim();
    const passphrase = String(headerPass || payload?.passphrase || payload?.code || payload?.pass || "").trim();
    const dailyLimit = Number(payload?.dailyLimit || 15);

    if (!prompt) return textOk(request, ""); // website already blocks empty prompts

        // Gate: Included key requires Premium passphrase (server-side)
    const allowed = normalizePassphrases(env.ALLOWED_PASSPHRASES);
    if (access === "included") {
      if (!allowed.length) {
        return jsonError(request, 500, "Server not configured: ALLOWED_PASSPHRASES is empty.");
      }
      if (!passphrase || !allowed.includes(passphrase)) {
        return jsonError(request, 401, "Passphrase required (or incorrect).");
      }
    }


    // Rate limit only for included key
    if (access === "included") {
      const rl = await checkRateLimit(env, dailyLimit, passphrase);
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
